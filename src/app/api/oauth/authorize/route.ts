import { NextRequest, NextResponse } from 'next/server';
import { getApiCredentialsByClientId, createOAuthSession, logSecurityEvent, recordUsageStats } from '@/lib/firebase';
import rateLimiter from '@/lib/rateLimiter';
import {
  generateSessionId,
  generateRotationId,
  generateState,
  generateAuthorizationCode,
  generateSessionUrl,
  validateScopes,
  stringToScopes,
  isValidRedirectUri,
  createOAuthError,
  createSecurityLogData,
  addMinutes,
  createErrorResponse,
  getClientIpAddress,
} from '@/lib/utils';
import { AuthorizeRequest, OAuthError, SessionUrlComponents } from '@/types';

export async function GET(request: NextRequest) {
  return handleAuthorizeRequest(request);
}

export async function POST(request: NextRequest) {
  return handleAuthorizeRequest(request);
}

async function handleAuthorizeRequest(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const clientIp = getClientIpAddress(request);

  try {
    // Extract OAuth parameters from URL or body
    const params = extractOAuthParams(request, searchParams);

    // Validate required parameters
    const validationError = validateOAuthParams(params);
    if (validationError) {
      await logSecurityEvent(createSecurityLogData(
        'oauth_authorize',
        false,
        request,
        undefined,
        params.client_id,
        validationError.error_description,
        { params }
      ));

      return createOAuthErrorResponse(validationError, params.state);
    }

    // Get API credentials
    const credentials = await getApiCredentialsByClientId(params.client_id);
    if (!credentials || !credentials.isActive) {
      const error = createOAuthError(
        'invalid_client',
        'Invalid or inactive client_id',
        params.state
      );

      await logSecurityEvent(createSecurityLogData(
        'oauth_authorize',
        false,
        request,
        undefined,
        params.client_id,
        'Invalid or inactive client',
        { params }
      ));

      return createOAuthErrorResponse(error, params.state);
    }

    // Check rate limiting
    const rateLimitResult = await rateLimiter.checkApiCredentialsRateLimit(credentials, 'authorize');
    if (!rateLimitResult.allowed) {
      const error = createOAuthError(
        'temporarily_unavailable',
        'Rate limit exceeded. Please try again later.',
        params.state
      );

      await recordUsageStats(credentials.id, false);
      await logSecurityEvent(createSecurityLogData(
        'oauth_authorize',
        false,
        request,
        undefined,
        credentials.id,
        'Rate limit exceeded',
        { rateLimitResult }
      ));

      return createOAuthErrorResponse(error, params.state);
    }

    // Validate redirect URI
    if (!isValidRedirectUri(params.redirect_uri, credentials.redirectUris)) {
      const error = createOAuthError(
        'invalid_request',
        'Invalid redirect_uri',
        params.state
      );

      await logSecurityEvent(createSecurityLogData(
        'oauth_authorize',
        false,
        request,
        undefined,
        credentials.id,
        'Invalid redirect URI',
        { params }
      ));

      return createOAuthErrorResponse(error, params.state);
    }

    // Validate and normalize scopes
    const requestedScopes = stringToScopes(params.scope);
    const validScopes = validateScopes(requestedScopes);

    if (validScopes.length === 0) {
      const error = createOAuthError(
        'invalid_scope',
        'No valid scopes provided',
        params.state
      );

      return redirectWithError(params.redirect_uri, error);
    }

    // Generate session components
    const sessionId = generateSessionId(); // 128-bit decoded ID
    const rotationId = generateRotationId(); // Developer website rotation ID
    const loginNumber = await getNextLoginNumber(credentials.id); // Current login number

    // Create OAuth session
    const sessionData = {
      sessionId,
      rotationId,
      loginNumber,
      userId: '', // Will be set after user authentication
      credentialId: credentials.id,
      state: params.state,
      codeChallenge: params.code_challenge,
      codeChallengeMethod: params.code_challenge_method,
      redirectUri: params.redirect_uri,
      scopes: validScopes,
      status: 'pending' as const,
      expiresAt: addMinutes(new Date(), 10), // 10 minutes expiry
    };

    const sessionDocId = await createOAuthSession(sessionData);

    // Generate session URL as specified
    const sessionUrlComponents: SessionUrlComponents = {
      sessionId,
      rotationId,
      loginNumber,
    };

    const sessionUrl = generateSessionUrl(sessionUrlComponents);

    // Record successful request
    await rateLimiter.recordApiRequest(credentials, true, 'authorize');
    await recordUsageStats(credentials.id, true);

    await logSecurityEvent(createSecurityLogData(
      'oauth_authorize',
      true,
      request,
      undefined,
      credentials.id,
      undefined,
      {
        sessionId,
        rotationId,
        loginNumber,
        scopes: validScopes,
        sessionUrl
      }
    ));

    // Return authorization page or redirect to login
    const authPageUrl = `/auth/login?session=${sessionDocId}&client_name=${encodeURIComponent(credentials.name)}`;

    // If this is an API request (has Accept: application/json), return JSON
    const acceptHeader = request.headers.get('accept');
    if (acceptHeader?.includes('application/json')) {
      return NextResponse.json({
        success: true,
        data: {
          authorization_url: authPageUrl,
          session_url: sessionUrl,
          session_id: sessionId,
          rotation_id: rotationId,
          login_number: loginNumber,
          expires_in: 600, // 10 minutes
        },
      });
    }

    // Otherwise redirect to authorization page
    return NextResponse.redirect(new URL(authPageUrl, request.url));

  } catch (error) {
    console.error('OAuth authorize error:', error);

    await logSecurityEvent(createSecurityLogData(
      'oauth_authorize',
      false,
      request,
      undefined,
      undefined,
      'Internal server error',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    ));

    const oauthError = createOAuthError(
      'server_error',
      'Internal server error occurred'
    );

    return createOAuthErrorResponse(oauthError);
  }
}

function extractOAuthParams(request: NextRequest, searchParams: URLSearchParams): AuthorizeRequest {
  return {
    response_type: searchParams.get('response_type') || '',
    client_id: searchParams.get('client_id') || '',
    redirect_uri: searchParams.get('redirect_uri') || '',
    scope: searchParams.get('scope') || '',
    state: searchParams.get('state') || '',
    code_challenge: searchParams.get('code_challenge') || undefined,
    code_challenge_method: (searchParams.get('code_challenge_method') as 'S256' | 'plain') || undefined,
  };
}

function validateOAuthParams(params: AuthorizeRequest): OAuthError | null {
  // Validate response_type
  if (params.response_type !== 'code') {
    return createOAuthError(
      'unsupported_response_type',
      'Only response_type=code is supported',
      params.state
    );
  }

  // Validate client_id
  if (!params.client_id) {
    return createOAuthError(
      'invalid_request',
      'client_id is required',
      params.state
    );
  }

  // Validate redirect_uri
  if (!params.redirect_uri) {
    return createOAuthError(
      'invalid_request',
      'redirect_uri is required',
      params.state
    );
  }

  // Validate redirect_uri format
  try {
    new URL(params.redirect_uri);
  } catch {
    return createOAuthError(
      'invalid_request',
      'redirect_uri must be a valid URL',
      params.state
    );
  }

  // Validate scope
  if (!params.scope) {
    return createOAuthError(
      'invalid_request',
      'scope is required',
      params.state
    );
  }

  // Validate PKCE parameters if provided
  if (params.code_challenge) {
    if (!params.code_challenge_method) {
      return createOAuthError(
        'invalid_request',
        'code_challenge_method is required when code_challenge is provided',
        params.state
      );
    }

    if (!['S256', 'plain'].includes(params.code_challenge_method)) {
      return createOAuthError(
        'invalid_request',
        'code_challenge_method must be S256 or plain',
        params.state
      );
    }
  }

  return null;
}

function createOAuthErrorResponse(error: OAuthError, state?: string): NextResponse {
  const response = NextResponse.json(error, { status: 400 });

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

function redirectWithError(redirectUri: string, error: OAuthError): NextResponse {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error.error);

  if (error.error_description) {
    url.searchParams.set('error_description', error.error_description);
  }

  if (error.state) {
    url.searchParams.set('state', error.state);
  }

  return NextResponse.redirect(url.toString());
}

async function getNextLoginNumber(credentialId: string): Promise<number> {
  // Simple incrementing counter - in production, you might want to use a more sophisticated approach
  // For now, we'll use timestamp-based approach to ensure uniqueness
  return Date.now() % 1000000; // Keep it reasonable size
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiCredentialsByClientId,
  getOAuthSession,
  updateOAuthSession,
  recordUsageStats,
  logSecurityEvent,
  adminDb,
} from '@/lib/firebase';
import rateLimiter from '@/lib/rateLimiter';
import {
  generateAccessToken,
  generateRefreshToken,
  generateJWT,
  verifyCodeChallenge,
  createOAuthError,
  createSecurityLogData,
  addHours,
  addDays,
  isExpired,
  scopesToString,
  getClientIpAddress,
} from '@/lib/utils';
import { TokenRequest, TokenResponse, OAuthError } from '@/types';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  const clientIp = getClientIpAddress(request);

  try {
    // Parse request body
    let tokenRequest: TokenRequest;

    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      tokenRequest = await request.json();
    } else {
      // Handle form-encoded data
      const formData = await request.formData();
      tokenRequest = {
        grant_type: formData.get('grant_type') as string,
        code: formData.get('code') as string || undefined,
        refresh_token: formData.get('refresh_token') as string || undefined,
        client_id: formData.get('client_id') as string,
        client_secret: formData.get('client_secret') as string,
        redirect_uri: formData.get('redirect_uri') as string || undefined,
        code_verifier: formData.get('code_verifier') as string || undefined,
      };
    }

    // Validate basic parameters
    const validationError = validateTokenRequest(tokenRequest);
    if (validationError) {
      await logSecurityEvent(createSecurityLogData(
        'oauth_token',
        false,
        request,
        undefined,
        tokenRequest.client_id,
        validationError.error_description,
        { tokenRequest: { ...tokenRequest, client_secret: '[REDACTED]' } }
      ));

      return createTokenErrorResponse(validationError);
    }

    // Get and validate API credentials
    const credentials = await getApiCredentialsByClientId(tokenRequest.client_id);
    if (!credentials || !credentials.isActive) {
      const error = createOAuthError('invalid_client', 'Invalid client credentials');

      await logSecurityEvent(createSecurityLogData(
        'oauth_token',
        false,
        request,
        undefined,
        tokenRequest.client_id,
        'Invalid client credentials'
      ));

      return createTokenErrorResponse(error);
    }

    // Verify client secret
    if (credentials.clientSecret !== tokenRequest.client_secret) {
      const error = createOAuthError('invalid_client', 'Invalid client credentials');

      await logSecurityEvent(createSecurityLogData(
        'oauth_token',
        false,
        request,
        undefined,
        credentials.id,
        'Invalid client secret'
      ));

      return createTokenErrorResponse(error);
    }

    // Check rate limiting
    const rateLimitResult = await rateLimiter.checkApiCredentialsRateLimit(credentials, 'token');
    if (!rateLimitResult.allowed) {
      const error = createOAuthError(
        'temporarily_unavailable',
        'Rate limit exceeded. Please try again later.'
      );

      await recordUsageStats(credentials.id, false);
      return createTokenErrorResponse(error);
    }

    // Handle different grant types
    let tokenResponse: TokenResponse;

    if (tokenRequest.grant_type === 'authorization_code') {
      tokenResponse = await handleAuthorizationCodeGrant(tokenRequest, credentials, request);
    } else if (tokenRequest.grant_type === 'refresh_token') {
      tokenResponse = await handleRefreshTokenGrant(tokenRequest, credentials, request);
    } else {
      const error = createOAuthError(
        'unsupported_grant_type',
        `Grant type '${tokenRequest.grant_type}' is not supported`
      );
      return createTokenErrorResponse(error);
    }

    // Record successful request
    await rateLimiter.recordApiRequest(credentials, true, 'token');
    await recordUsageStats(credentials.id, true);

    await logSecurityEvent(createSecurityLogData(
      'oauth_token',
      true,
      request,
      undefined,
      credentials.id,
      undefined,
      {
        grant_type: tokenRequest.grant_type,
        scopes: tokenResponse.scope,
      }
    ));

    return NextResponse.json(tokenResponse);

  } catch (error) {
    console.error('OAuth token error:', error);

    await logSecurityEvent(createSecurityLogData(
      'oauth_token',
      false,
      request,
      undefined,
      undefined,
      'Internal server error',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    ));

    const oauthError = createOAuthError('server_error', 'Internal server error occurred');
    return createTokenErrorResponse(oauthError);
  }
}

async function handleAuthorizationCodeGrant(
  tokenRequest: TokenRequest,
  credentials: any,
  request: NextRequest
): Promise<TokenResponse> {
  if (!tokenRequest.code) {
    throw createOAuthError('invalid_request', 'Authorization code is required');
  }

  if (!tokenRequest.redirect_uri) {
    throw createOAuthError('invalid_request', 'redirect_uri is required');
  }

  // Get authorization code from database
  const authCodeRef = doc(adminDb!, 'authorization_codes', tokenRequest.code);
  const authCodeDoc = await getDoc(authCodeRef);

  if (!authCodeDoc.exists()) {
    throw createOAuthError('invalid_grant', 'Invalid or expired authorization code');
  }

  const authCodeData = authCodeDoc.data();

  // Check if code is already used
  if (authCodeData.used) {
    throw createOAuthError('invalid_grant', 'Authorization code has already been used');
  }

  // Check if code is expired
  const expiresAt = authCodeData.expiresAt.toDate();
  if (isExpired(expiresAt)) {
    throw createOAuthError('invalid_grant', 'Authorization code has expired');
  }

  // Verify client_id matches
  if (authCodeData.credentialId !== credentials.id) {
    throw createOAuthError('invalid_grant', 'Authorization code was issued to a different client');
  }

  // Verify redirect_uri matches
  if (authCodeData.redirectUri !== tokenRequest.redirect_uri) {
    throw createOAuthError('invalid_grant', 'redirect_uri does not match');
  }

  // Verify PKCE if present
  if (authCodeData.codeChallenge && tokenRequest.code_verifier) {
    const isValidChallenge = verifyCodeChallenge(
      tokenRequest.code_verifier,
      authCodeData.codeChallenge
    );

    if (!isValidChallenge) {
      throw createOAuthError('invalid_grant', 'Invalid code verifier');
    }
  } else if (authCodeData.codeChallenge && !tokenRequest.code_verifier) {
    throw createOAuthError('invalid_request', 'code_verifier is required');
  }

  // Mark authorization code as used
  await setDoc(authCodeRef, { ...authCodeData, used: true }, { merge: true });

  // Generate tokens
  const accessToken = generateAccessToken();
  const refreshToken = generateRefreshToken();
  const now = new Date();
  const accessTokenExpiresAt = addHours(now, 1); // 1 hour
  const refreshTokenExpiresAt = addDays(now, 30); // 30 days

  // Store access token
  const accessTokenData = {
    token: accessToken,
    userId: authCodeData.userId,
    credentialId: credentials.id,
    sessionId: authCodeData.sessionId,
    scopes: authCodeData.scopes,
    tokenType: 'Bearer',
    expiresAt: Timestamp.fromDate(accessTokenExpiresAt),
    createdAt: Timestamp.fromDate(now),
    isRevoked: false,
  };

  await setDoc(doc(adminDb!, 'access_tokens', accessToken), accessTokenData);

  // Store refresh token
  const refreshTokenData = {
    token: refreshToken,
    userId: authCodeData.userId,
    credentialId: credentials.id,
    sessionId: authCodeData.sessionId,
    accessTokenId: accessToken,
    expiresAt: Timestamp.fromDate(refreshTokenExpiresAt),
    createdAt: Timestamp.fromDate(now),
    used: false,
  };

  await setDoc(doc(adminDb!, 'refresh_tokens', refreshToken), refreshTokenData);

  // Update OAuth session
  await updateOAuthSession(authCodeData.sessionId, {
    status: 'authorized',
    authorizedAt: now,
    accessToken,
    refreshToken,
    tokenExpiresAt: accessTokenExpiresAt,
  });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: Math.floor((accessTokenExpiresAt.getTime() - now.getTime()) / 1000),
    refresh_token: refreshToken,
    scope: scopesToString(authCodeData.scopes),
  };
}

async function handleRefreshTokenGrant(
  tokenRequest: TokenRequest,
  credentials: any,
  request: NextRequest
): Promise<TokenResponse> {
  if (!tokenRequest.refresh_token) {
    throw createOAuthError('invalid_request', 'Refresh token is required');
  }

  // Get refresh token from database
  const refreshTokenRef = doc(adminDb!, 'refresh_tokens', tokenRequest.refresh_token);
  const refreshTokenDoc = await getDoc(refreshTokenRef);

  if (!refreshTokenDoc.exists()) {
    throw createOAuthError('invalid_grant', 'Invalid refresh token');
  }

  const refreshTokenData = refreshTokenDoc.data();

  // Check if refresh token is already used
  if (refreshTokenData.used) {
    throw createOAuthError('invalid_grant', 'Refresh token has already been used');
  }

  // Check if refresh token is expired
  const expiresAt = refreshTokenData.expiresAt.toDate();
  if (isExpired(expiresAt)) {
    throw createOAuthError('invalid_grant', 'Refresh token has expired');
  }

  // Verify client_id matches
  if (refreshTokenData.credentialId !== credentials.id) {
    throw createOAuthError('invalid_grant', 'Refresh token was issued to a different client');
  }

  // Revoke old access token
  const oldAccessTokenRef = doc(adminDb!, 'access_tokens', refreshTokenData.accessTokenId);
  await setDoc(oldAccessTokenRef, { isRevoked: true }, { merge: true });

  // Generate new tokens
  const newAccessToken = generateAccessToken();
  const newRefreshToken = generateRefreshToken();
  const now = new Date();
  const accessTokenExpiresAt = addHours(now, 1); // 1 hour
  const refreshTokenExpiresAt = addDays(now, 30); // 30 days

  // Get original scopes from session or use default
  const session = await getOAuthSession(refreshTokenData.sessionId);
  const scopes = session?.scopes || ['openid', 'profile', 'email'];

  // Store new access token
  const accessTokenData = {
    token: newAccessToken,
    userId: refreshTokenData.userId,
    credentialId: credentials.id,
    sessionId: refreshTokenData.sessionId,
    scopes,
    tokenType: 'Bearer',
    expiresAt: Timestamp.fromDate(accessTokenExpiresAt),
    createdAt: Timestamp.fromDate(now),
    isRevoked: false,
  };

  await setDoc(doc(adminDb!, 'access_tokens', newAccessToken), accessTokenData);

  // Mark old refresh token as used and store replacement reference
  await setDoc(refreshTokenRef, {
    ...refreshTokenData,
    used: true,
    replacedBy: newRefreshToken,
  }, { merge: true });

  // Store new refresh token
  const newRefreshTokenData = {
    token: newRefreshToken,
    userId: refreshTokenData.userId,
    credentialId: credentials.id,
    sessionId: refreshTokenData.sessionId,
    accessTokenId: newAccessToken,
    expiresAt: Timestamp.fromDate(refreshTokenExpiresAt),
    createdAt: Timestamp.fromDate(now),
    used: false,
  };

  await setDoc(doc(adminDb!, 'refresh_tokens', newRefreshToken), newRefreshTokenData);

  // Update session with new tokens
  await updateOAuthSession(refreshTokenData.sessionId, {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    tokenExpiresAt: accessTokenExpiresAt,
  });

  return {
    access_token: newAccessToken,
    token_type: 'Bearer',
    expires_in: Math.floor((accessTokenExpiresAt.getTime() - now.getTime()) / 1000),
    refresh_token: newRefreshToken,
    scope: scopesToString(scopes),
  };
}

function validateTokenRequest(tokenRequest: TokenRequest): OAuthError | null {
  if (!tokenRequest.grant_type) {
    return createOAuthError('invalid_request', 'grant_type is required');
  }

  if (!['authorization_code', 'refresh_token'].includes(tokenRequest.grant_type)) {
    return createOAuthError(
      'unsupported_grant_type',
      'Only authorization_code and refresh_token grant types are supported'
    );
  }

  if (!tokenRequest.client_id) {
    return createOAuthError('invalid_request', 'client_id is required');
  }

  if (!tokenRequest.client_secret) {
    return createOAuthError('invalid_request', 'client_secret is required');
  }

  if (tokenRequest.grant_type === 'authorization_code') {
    if (!tokenRequest.code) {
      return createOAuthError('invalid_request', 'code is required for authorization_code grant');
    }

    if (!tokenRequest.redirect_uri) {
      return createOAuthError('invalid_request', 'redirect_uri is required for authorization_code grant');
    }
  }

  if (tokenRequest.grant_type === 'refresh_token') {
    if (!tokenRequest.refresh_token) {
      return createOAuthError('invalid_request', 'refresh_token is required for refresh_token grant');
    }
  }

  return null;
}

function createTokenErrorResponse(error: OAuthError): NextResponse {
  const status = getErrorStatusCode(error.error);
  const response = NextResponse.json(error, { status });

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

function getErrorStatusCode(error: string): number {
  switch (error) {
    case 'invalid_client':
      return 401;
    case 'invalid_grant':
    case 'invalid_request':
    case 'invalid_scope':
      return 400;
    case 'unsupported_grant_type':
      return 400;
    case 'temporarily_unavailable':
      return 503;
    case 'server_error':
      return 500;
    default:
      return 400;
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

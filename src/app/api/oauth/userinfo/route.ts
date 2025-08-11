import { NextRequest, NextResponse } from 'next/server';
import {
  getUser,
  recordUsageStats,
  logSecurityEvent,
  adminDb,
} from '@/lib/firebase';
import rateLimiter from '@/lib/rateLimiter';
import {
  createOAuthError,
  createSecurityLogData,
  isExpired,
  getClientIpAddress,
} from '@/lib/utils';
import { UserInfoResponse, OAuthError } from '@/types';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  return handleUserInfoRequest(request);
}

export async function POST(request: NextRequest) {
  return handleUserInfoRequest(request);
}

async function handleUserInfoRequest(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIpAddress(request);

  try {
    // Extract access token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      const error = createOAuthError('invalid_request', 'Authorization header is required');

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        undefined,
        undefined,
        'Missing authorization header'
      ));

      return createUserInfoErrorResponse(error, 401);
    }

    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
    if (!tokenMatch) {
      const error = createOAuthError('invalid_request', 'Invalid authorization header format');

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        undefined,
        undefined,
        'Invalid authorization header format'
      ));

      return createUserInfoErrorResponse(error, 401);
    }

    const accessToken = tokenMatch[1];

    // Get access token from database
    const accessTokenRef = doc(adminDb!, 'access_tokens', accessToken);
    const accessTokenDoc = await getDoc(accessTokenRef);

    if (!accessTokenDoc.exists()) {
      const error = createOAuthError('invalid_token', 'Invalid access token');

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        undefined,
        undefined,
        'Invalid access token'
      ));

      return createUserInfoErrorResponse(error, 401);
    }

    const tokenData = accessTokenDoc.data();

    // Check if token is revoked
    if (tokenData.isRevoked) {
      const error = createOAuthError('invalid_token', 'Access token has been revoked');

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        tokenData.userId,
        tokenData.credentialId,
        'Revoked access token used'
      ));

      return createUserInfoErrorResponse(error, 401);
    }

    // Check if token is expired
    const expiresAt = tokenData.expiresAt.toDate();
    if (isExpired(expiresAt)) {
      const error = createOAuthError('invalid_token', 'Access token has expired');

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        tokenData.userId,
        tokenData.credentialId,
        'Expired access token used'
      ));

      return createUserInfoErrorResponse(error, 401);
    }

    // Check if token has required scopes for userinfo
    const requiredScopes = ['openid', 'profile'];
    const hasRequiredScope = requiredScopes.some(scope =>
      tokenData.scopes.includes(scope)
    );

    if (!hasRequiredScope) {
      const error = createOAuthError('insufficient_scope', 'Token does not have required scopes for userinfo');

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        tokenData.userId,
        tokenData.credentialId,
        'Insufficient scope for userinfo',
        { tokenScopes: tokenData.scopes, requiredScopes }
      ));

      return createUserInfoErrorResponse(error, 403);
    }

    // Get API credentials for rate limiting
    const credentialsRef = doc(adminDb!, 'api_credentials', tokenData.credentialId);
    const credentialsDoc = await getDoc(credentialsRef);

    if (!credentialsDoc.exists() || !credentialsDoc.data().isActive) {
      const error = createOAuthError('invalid_token', 'Associated client credentials are invalid or inactive');

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        tokenData.userId,
        tokenData.credentialId,
        'Invalid or inactive client credentials'
      ));

      return createUserInfoErrorResponse(error, 401);
    }

    const credentials = { id: credentialsDoc.id, ...credentialsDoc.data() };

    // Check rate limiting
    const rateLimitResult = await rateLimiter.checkApiCredentialsRateLimit(credentials, 'userinfo');
    if (!rateLimitResult.allowed) {
      const error = createOAuthError(
        'temporarily_unavailable',
        'Rate limit exceeded. Please try again later.'
      );

      await recordUsageStats(credentials.id, false);

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        tokenData.userId,
        tokenData.credentialId,
        'Rate limit exceeded'
      ));

      return createUserInfoErrorResponse(error, 429);
    }

    // Get user information
    const user = await getUser(tokenData.userId);
    if (!user) {
      const error = createOAuthError('invalid_token', 'User associated with token not found');

      await logSecurityEvent(createSecurityLogData(
        'oauth_userinfo',
        false,
        request,
        tokenData.userId,
        tokenData.credentialId,
        'User not found'
      ));

      return createUserInfoErrorResponse(error, 404);
    }

    // Build user info response based on scopes
    const userInfo: UserInfoResponse = {
      sub: user.id, // Subject identifier
    };

    // Add profile information if profile scope is present
    if (tokenData.scopes.includes('profile')) {
      if (user.displayName) {
        userInfo.name = user.displayName;

        // Try to extract given_name and family_name
        const nameParts = user.displayName.split(' ');
        if (nameParts.length > 0) {
          userInfo.given_name = nameParts[0];
        }
        if (nameParts.length > 1) {
          userInfo.family_name = nameParts.slice(1).join(' ');
        }
      }

      if (user.photoURL) {
        userInfo.picture = user.photoURL;
      }

      // Add locale if available (could be stored in user metadata)
      userInfo.locale = 'en-US'; // Default locale
    }

    // Add email information if email scope is present
    if (tokenData.scopes.includes('email')) {
      userInfo.email = user.email;
      userInfo.email_verified = user.emailVerified;
    }

    // Record successful request
    await rateLimiter.recordApiRequest(credentials, true, 'userinfo');
    await recordUsageStats(credentials.id, true);

    await logSecurityEvent(createSecurityLogData(
      'oauth_userinfo',
      true,
      request,
      tokenData.userId,
      tokenData.credentialId,
      undefined,
      {
        scopes: tokenData.scopes,
        returnedFields: Object.keys(userInfo)
      }
    ));

    // Return user info
    const response = NextResponse.json(userInfo);

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Add cache headers (userinfo should be cached briefly)
    response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes

    return response;

  } catch (error) {
    console.error('OAuth userinfo error:', error);

    await logSecurityEvent(createSecurityLogData(
      'oauth_userinfo',
      false,
      request,
      undefined,
      undefined,
      'Internal server error',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    ));

    const oauthError = createOAuthError('server_error', 'Internal server error occurred');
    return createUserInfoErrorResponse(oauthError, 500);
  }
}

function createUserInfoErrorResponse(error: OAuthError, status: number = 400): NextResponse {
  const response = NextResponse.json(error, { status });

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Add WWW-Authenticate header for 401 responses
  if (status === 401) {
    let wwwAuthenticateValue = 'Bearer';

    if (error.error === 'invalid_token') {
      wwwAuthenticateValue += ` error="invalid_token"`;
    } else if (error.error === 'insufficient_scope') {
      wwwAuthenticateValue += ` error="insufficient_scope"`;
    }

    if (error.error_description) {
      wwwAuthenticateValue += `, error_description="${error.error_description}"`;
    }

    response.headers.set('WWW-Authenticate', wwwAuthenticateValue);
  }

  return response;
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

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserApiCredentials,
  getUser,
  logSecurityEvent,
} from '@/lib/firebase';
import rateLimiter from '@/lib/rateLimiter';
import {
  createSuccessResponse,
  createErrorResponse,
  createSecurityLogData,
  getClientIpAddress,
} from '@/lib/utils';

interface KeysParams {
  userId: string;
}

// GET /api/keys/[userId] - Get user's API keys and credentials
export async function GET(
  request: NextRequest,
  { params }: { params: KeysParams }
) {
  const clientIp = getClientIpAddress(request);
  const { userId } = params;

  try {
    if (!userId) {
      await logSecurityEvent(createSecurityLogData(
        'api_keys_view',
        false,
        request,
        undefined,
        undefined,
        'Missing userId parameter'
      ));

      return NextResponse.json(
        createErrorResponse('userId parameter is required'),
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUser(userId);
    if (!user) {
      await logSecurityEvent(createSecurityLogData(
        'api_keys_view',
        false,
        request,
        userId,
        undefined,
        'User not found'
      ));

      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      );
    }

    // Check rate limiting for this user
    const rateLimitResult = await rateLimiter.checkUserRateLimit(userId);
    if (!rateLimitResult.allowed) {
      await logSecurityEvent(createSecurityLogData(
        'api_keys_view',
        false,
        request,
        userId,
        undefined,
        'Rate limit exceeded'
      ));

      return NextResponse.json(
        createErrorResponse('Rate limit exceeded. Please try again later.'),
        { status: 429 }
      );
    }

    // Get user's API credentials
    const credentials = await getUserApiCredentials(userId);

    // Format credentials for display
    const formattedCredentials = credentials.map(cred => ({
      id: cred.id,
      name: cred.name,
      description: cred.description,
      clientId: cred.clientId,
      clientSecret: cred.clientSecret,
      apiKey: cred.apiKey, // This is the public API key
      redirectUris: cred.redirectUris,
      allowedOrigins: cred.allowedOrigins,
      scopes: cred.scopes,
      isActive: cred.isActive,
      createdAt: cred.createdAt,
      lastUsed: cred.lastUsed,
      rateLimit: cred.rateLimit,
      // Generate OAuth URL template for this credential
      oauthUrlTemplate: `${process.env.APP_URL || 'http://localhost:3000'}/api/generate/${cred.id}/${cred.apiKey}/grab`,
      // Usage instructions
      usageInstructions: {
        generateOAuthUrl: `GET ${process.env.APP_URL || 'http://localhost:3000'}/api/generate/${cred.id}/${cred.apiKey}/grab?redirect_uri=YOUR_REDIRECT_URI&scope=profile email&state=YOUR_STATE`,
        authorizeUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/authorize`,
        tokenUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/token`,
        userinfoUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/userinfo`
      }
    }));

    await logSecurityEvent(createSecurityLogData(
      'api_keys_view',
      true,
      request,
      userId,
      undefined,
      undefined,
      { credentialsCount: credentials.length }
    ));

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName || user.email.split('@')[0]
        },
        credentials: formattedCredentials,
        totalCredentials: credentials.length,
        instructions: {
          createNew: `POST ${process.env.APP_URL || 'http://localhost:3000'}/api/credentials`,
          generateOAuth: 'Use the oauthUrlTemplate from each credential',
          documentation: `${process.env.APP_URL || 'http://localhost:3000'}/docs`
        }
      }, 'API keys retrieved successfully')
    );

  } catch (error) {
    console.error('Get API keys error:', error);

    await logSecurityEvent(createSecurityLogData(
      'api_keys_view',
      false,
      request,
      userId,
      undefined,
      'Internal server error',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    ));

    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

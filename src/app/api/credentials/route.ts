import { NextRequest, NextResponse } from 'next/server';
import {
  createApiCredentials,
  getUserApiCredentials,
  getUser,
  logSecurityEvent,
  recordUsageStats,
} from '@/lib/firebase';
import rateLimiter from '@/lib/rateLimiter';
import {
  generateClientId,
  generateClientSecret,
  generateApiKey,
  createSuccessResponse,
  createErrorResponse,
  createSecurityLogData,
  sanitizeRedirectUris,
  sanitizeAllowedOrigins,
  validateScopes,
  stringToScopes,
  getClientIpAddress,
} from '@/lib/utils';
import { CreateCredentialForm, ApiCredentials } from '@/types';

// GET /api/credentials - Get user's API credentials
export async function GET(request: NextRequest) {
  const clientIp = getClientIpAddress(request);
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  try {
    if (!userId) {
      await logSecurityEvent(createSecurityLogData(
        'credentials_list',
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
        'credentials_list',
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
        'credentials_list',
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

    await logSecurityEvent(createSecurityLogData(
      'credentials_list',
      true,
      request,
      userId,
      undefined,
      undefined,
      { credentialsCount: credentials.length }
    ));

    return NextResponse.json(
      createSuccessResponse(credentials, 'Credentials retrieved successfully')
    );

  } catch (error) {
    console.error('Get credentials error:', error);

    await logSecurityEvent(createSecurityLogData(
      'credentials_list',
      false,
      request,
      userId || undefined,
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

// POST /api/credentials - Create new API credentials
export async function POST(request: NextRequest) {
  const clientIp = getClientIpAddress(request);

  try {
    const body: CreateCredentialForm & { userId: string } = await request.json();
    const {
      userId,
      name,
      description,
      redirectUris,
      allowedOrigins,
      scopes,
      rateLimit: rateLimitConfig,
    } = body;

    // Validate required fields
    if (!userId || !name || !redirectUris) {
      await logSecurityEvent(createSecurityLogData(
        'credentials_create',
        false,
        request,
        userId,
        undefined,
        'Missing required fields',
        { body: { ...body, userId: '[REDACTED]' } }
      ));

      return NextResponse.json(
        createErrorResponse('Missing required fields: userId, name, redirectUris'),
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUser(userId);
    if (!user) {
      await logSecurityEvent(createSecurityLogData(
        'credentials_create',
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
    const rateLimitResult = await rateLimiter.checkUserRateLimit(userId, {
      maxRequests: 10, // Lower limit for creating credentials
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimitResult.allowed) {
      await logSecurityEvent(createSecurityLogData(
        'credentials_create',
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

    // Validate and sanitize redirect URIs
    const sanitizedRedirectUris = sanitizeRedirectUris(redirectUris);
    if (sanitizedRedirectUris.length === 0) {
      return NextResponse.json(
        createErrorResponse('At least one valid redirect URI is required'),
        { status: 400 }
      );
    }

    // Validate and sanitize allowed origins
    const sanitizedAllowedOrigins = allowedOrigins
      ? sanitizeAllowedOrigins(allowedOrigins)
      : [];

    // Validate scopes
    const validatedScopes = validateScopes(scopes || []);
    if (validatedScopes.length === 0) {
      return NextResponse.json(
        createErrorResponse('At least one valid scope is required'),
        { status: 400 }
      );
    }

    // Validate rate limit configuration
    const maxRequests = rateLimitConfig?.maxRequests || 1000;
    const windowMs = rateLimitConfig?.windowMs || 3600000; // 1 hour

    if (maxRequests < 1 || maxRequests > 10000) {
      return NextResponse.json(
        createErrorResponse('Max requests must be between 1 and 10,000'),
        { status: 400 }
      );
    }

    if (windowMs < 60000 || windowMs > 86400000) { // 1 minute to 24 hours
      return NextResponse.json(
        createErrorResponse('Window must be between 1 minute and 24 hours'),
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 1 || name.length > 100) {
      return NextResponse.json(
        createErrorResponse('Name must be between 1 and 100 characters'),
        { status: 400 }
      );
    }

    // Validate description length if provided
    if (description && description.length > 500) {
      return NextResponse.json(
        createErrorResponse('Description must be less than 500 characters'),
        { status: 400 }
      );
    }

    // Generate credentials
    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const apiKey = generateApiKey();

    // Create credential data
    const credentialData: Omit<ApiCredentials, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      clientId,
      clientSecret,
      apiKey,
      name: name.trim(),
      description: description?.trim() || undefined,
      redirectUris: sanitizedRedirectUris,
      allowedOrigins: sanitizedAllowedOrigins,
      scopes: validatedScopes,
      isActive: true,
      lastUsed: undefined,
      rateLimit: {
        maxRequests,
        windowMs,
        enabled: true,
      },
    };

    // Create the credentials in the database
    const credentialId = await createApiCredentials(credentialData);

    // Create the response credential object
    const newCredential: ApiCredentials = {
      id: credentialId,
      ...credentialData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await logSecurityEvent(createSecurityLogData(
      'credentials_create',
      true,
      request,
      userId,
      credentialId,
      undefined,
      {
        name,
        clientId,
        apiKey,
        scopes: validatedScopes,
        redirectUris: sanitizedRedirectUris,
        rateLimit: { maxRequests, windowMs },
      }
    ));

    return NextResponse.json(
      createSuccessResponse(newCredential, 'API credentials created successfully'),
      { status: 201 }
    );

  } catch (error) {
    console.error('Create credentials error:', error);

    await logSecurityEvent(createSecurityLogData(
      'credentials_create',
      false,
      request,
      undefined,
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

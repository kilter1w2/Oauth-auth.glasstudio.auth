import { NextRequest, NextResponse } from 'next/server';
import { 
  getApiCredentials, 
  getUser, 
  logSecurityEvent, 
  recordUsageStats 
} from '@/lib/firebase';
import rateLimiter from '@/lib/rateLimiter';
import {
  createSuccessResponse,
  createErrorResponse,
  createSecurityLogData,
  getClientIpAddress,
  generateSessionUrl,
  generateSessionId,
  generateRotationId,
  addMinutes,
} from '@/lib/utils';

interface GenerateParams {
  id: string;
  publicApiKey: string;
}

// GET /api/generate/[id]/[publicApiKey]/grab - Generate OAuth URL for API key
export async function GET(
  request: NextRequest,
  { params }: { params: GenerateParams }
) {
  const clientIp = getClientIpAddress(request);
  const { id, publicApiKey } = params;
  const searchParams = request.nextUrl.searchParams;

  // Extract optional parameters
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'profile email';
  const state = searchParams.get('state');

  try {
    // Validate parameters
    if (!id || !publicApiKey) {
      await logSecurityEvent(createSecurityLogData(
        'api_generate_oauth',
        false,
        request,
        undefined,
        undefined,
        'Missing required parameters (id or publicApiKey)',
        { id, publicApiKey: publicApiKey ? '[PRESENT]' : '[MISSING]' }
      ));

      return NextResponse.json(
        createErrorResponse('Missing required parameters: id and publicApiKey'),
        { status: 400 }
      );
    }

    // Get API credentials by ID
    const credentials = await getApiCredentials(id);
    if (!credentials || !credentials.isActive) {
      await logSecurityEvent(createSecurityLogData(
        'api_generate_oauth',
        false,
        request,
        undefined,
        id,
        'Invalid or inactive API credentials',
        { id, publicApiKey: '[REDACTED]' }
      ));

      return NextResponse.json(
        createErrorResponse('Invalid or inactive API credentials'),
        { status: 404 }
      );
    }

    // Verify the public API key matches
    if (credentials.apiKey !== publicApiKey) {
      await logSecurityEvent(createSecurityLogData(
        'api_generate_oauth',
        false,
        request,
        credentials.userId,
        credentials.id,
        'API key mismatch',
        { providedKey: publicApiKey.substring(0, 8) + '...' }
      ));

      return NextResponse.json(
        createErrorResponse('Invalid API key'),
        { status: 401 }
      );
    }

    // Check rate limiting
    const rateLimitResult = await rateLimiter.checkApiCredentialsRateLimit(credentials, 'generate');
    if (!rateLimitResult.allowed) {
      await recordUsageStats(credentials.id, false);
      await logSecurityEvent(createSecurityLogData(
        'api_generate_oauth',
        false,
        request,
        credentials.userId,
        credentials.id,
        'Rate limit exceeded',
        { rateLimitResult }
      ));

      return NextResponse.json(
        createErrorResponse('Rate limit exceeded. Please try again later.'),
        { status: 429 }
      );
    }

    // Verify user exists
    const user = await getUser(credentials.userId);
    if (!user) {
      await logSecurityEvent(createSecurityLogData(
        'api_generate_oauth',
        false,
        request,
        credentials.userId,
        credentials.id,
        'User not found'
      ));

      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      );
    }

    // Use the first redirect URI if none provided
    const finalRedirectUri = redirectUri || credentials.redirectUris[0];
    if (!finalRedirectUri) {
      return NextResponse.json(
        createErrorResponse('No redirect URI available'),
        { status: 400 }
      );
    }

    // Generate OAuth authorization URL
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const authUrl = new URL(`${baseUrl}/api/oauth/authorize`);
    
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', credentials.clientId);
    authUrl.searchParams.set('redirect_uri', finalRedirectUri);
    authUrl.searchParams.set('scope', scope);
    
    if (state) {
      authUrl.searchParams.set('state', state);
    }

    // Record successful API usage
    await recordUsageStats(credentials.id, true);
    
    // Log successful generation
    await logSecurityEvent(createSecurityLogData(
      'api_generate_oauth',
      true,
      request,
      credentials.userId,
      credentials.id,
      undefined,
      {
        redirectUri: finalRedirectUri,
        scope,
        state,
        generatedUrl: authUrl.toString()
      }
    ));

    return NextResponse.json(
      createSuccessResponse({
        oauth_url: authUrl.toString(),
        client_id: credentials.clientId,
        redirect_uri: finalRedirectUri,
        scope,
        state,
        expires_in: 3600, // 1 hour
        api_name: credentials.name,
        api_description: credentials.description
      }, 'OAuth URL generated successfully')
    );

  } catch (error) {
    console.error('Generate OAuth URL error:', error);

    await logSecurityEvent(createSecurityLogData(
      'api_generate_oauth',
      false,
      request,
      undefined,
      id,
      'Internal server error',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    ));

    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// POST /api/generate/[id]/[publicApiKey]/grab - Same functionality via POST
export async function POST(
  request: NextRequest,
  { params }: { params: GenerateParams }
) {
  return GET(request, { params });
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

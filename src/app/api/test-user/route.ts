import { NextRequest, NextResponse } from 'next/server';
import { createUser, createApiCredentials } from '@/lib/firebase';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  generateClientId, 
  generateClientSecret, 
  generateApiKey 
} from '@/lib/utils';

// POST /api/test-user - Create a test user and API credentials
export async function POST(request: NextRequest) {
  try {
    // Create a test user
    const testUserData = {
      email: 'test@glasstudio.auth',
      displayName: 'Test User',
      provider: 'email' as const,
      emailVerified: true,
      isActive: true,
    };

    const userId = await createUser(testUserData);

    // Create test API credentials for this user
    const credentialsData = {
      userId,
      clientId: generateClientId(),
      clientSecret: generateClientSecret(),
      apiKey: generateApiKey(),
      name: 'Test OAuth App',
      description: 'Test API credentials for development',
      redirectUris: ['http://localhost:3002/test/callback', 'http://localhost:3003/test/callback'],
      allowedOrigins: ['http://localhost:3002', 'http://localhost:3003'],
      scopes: ['profile', 'email'],
      isActive: true,
      lastUsed: undefined,
      rateLimit: {
        maxRequests: 1000,
        windowMs: 3600000, // 1 hour
        enabled: true,
      },
    };

    const credentialId = await createApiCredentials(credentialsData);

    return NextResponse.json(
      createSuccessResponse({
        userId,
        credentialId,
        message: 'Test user and credentials created successfully',
        instructions: {
          viewCredentials: `GET /api/keys/${userId}`,
          testOAuth: `Use the credential ID and API key from /api/keys/${userId}`,
        }
      }, 'Test setup completed')
    );

  } catch (error) {
    console.error('Test user creation error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create test user'),
      { status: 500 }
    );
  }
}

// GET /api/test-user - Get test user info
export async function GET(request: NextRequest) {
  return NextResponse.json(
    createSuccessResponse({
      message: 'Use POST to create a test user and credentials',
      endpoints: {
        createTestUser: 'POST /api/test-user',
        viewCredentials: 'GET /api/keys/{userId}',
        generateOAuth: 'GET /api/generate/{credId}/{apiKey}/grab/',
      }
    }, 'Test user endpoint info')
  );
}

/**
 * Development Setup Utilities
 *
 * This file provides utilities for easy development and testing of the OAuth system
 * without requiring full Firebase Admin SDK setup initially.
 */

import { nanoid } from 'nanoid';
import {
  generateClientId,
  generateClientSecret,
  generateApiKey,
  generateAccessToken,
  generateRefreshToken,
  generateAuthorizationCode,
  generateSessionId,
  generateRotationId,
  createSuccessResponse,
  createErrorResponse,
} from './utils';
import { ApiCredentials, User, OAuthSession } from '@/types';

// Development mode flag
export const isDevelopmentMode = process.env.NODE_ENV === 'development';

// Mock data storage for development (in-memory)
const mockStorage = {
  users: new Map<string, User>(),
  credentials: new Map<string, ApiCredentials>(),
  sessions: new Map<string, OAuthSession>(),
  accessKeys: new Map<string, any>(),
};

/**
 * Initialize development environment with mock data
 */
export function initDevEnvironment() {
  if (!isDevelopmentMode) {
    console.warn('initDevEnvironment should only be called in development mode');
    return;
  }

  console.log('🚀 Initializing GLAStudio OAuth Development Environment...');

  // Create a default test user
  const testUser = createMockUser('test@example.com', 'Test User');
  mockStorage.users.set(testUser.id, testUser);

  // Create default API credentials for testing
  const testCredentials = createMockCredentials(testUser.id, 'Test Application');
  mockStorage.credentials.set(testCredentials.id, testCredentials);

  // Create a test access key
  const testAccessKey = createMockAccessKey(testUser.id, 'Test Access Key');
  mockStorage.accessKeys.set(testAccessKey.id, testAccessKey);

  console.log('✅ Development environment initialized!');
  console.log('📋 Test Data Created:');
  console.log(`   User Email: ${testUser.email}`);
  console.log(`   Client ID: ${testCredentials.clientId}`);
  console.log(`   Client Secret: ${testCredentials.clientSecret}`);
  console.log(`   API Key: ${testCredentials.apiKey}`);
  console.log(`   Access Key: ${testAccessKey.accessKey}`);
  console.log(`   Access Secret: ${testAccessKey.keySecret}`);

  return {
    testUser,
    testCredentials,
    testAccessKey,
  };
}

/**
 * Create a mock user for testing
 */
export function createMockUser(email: string, displayName?: string): User {
  const now = new Date();
  const userId = `user_${nanoid(16)}`;

  return {
    id: userId,
    email,
    displayName: displayName || email.split('@')[0],
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
    provider: 'email',
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    metadata: {
      lastSignInTime: now,
      creationTime: now,
      lastRefreshTime: now,
    },
  };
}

/**
 * Create mock API credentials for testing
 */
export function createMockCredentials(userId: string, name: string): ApiCredentials {
  const now = new Date();
  const credentialId = `cred_${nanoid(16)}`;

  return {
    id: credentialId,
    userId,
    clientId: generateClientId(),
    clientSecret: generateClientSecret(),
    apiKey: generateApiKey(),
    name,
    description: `Test credentials for ${name}`,
    redirectUris: [
      'http://localhost:3000/callback',
      'http://localhost:3001/callback',
      'https://example.com/callback',
    ],
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://example.com',
    ],
    scopes: ['openid', 'profile', 'email'],
    isActive: true,
    createdAt: now,
    updatedAt: now,
    rateLimit: {
      maxRequests: 1000,
      windowMs: 3600000, // 1 hour
      enabled: true,
    },
  };
}

/**
 * Create mock access key for testing
 */
export function createMockAccessKey(userId: string, keyName: string) {
  const now = new Date();
  const keyId = `key_${nanoid(16)}`;

  return {
    id: keyId,
    userId,
    keyName,
    accessKey: `gla_user_${nanoid(32)}`,
    keySecret: generateClientSecret(),
    permissions: ['read', 'write'],
    isActive: true,
    lastUsed: undefined,
    createdAt: now,
    expiresAt: undefined,
    description: `Test access key for ${keyName}`,
    usageCount: 0,
  };
}

/**
 * Development-only mock implementations for Firebase functions
 */
export const devMockImplementations = {
  async getUser(userId: string) {
    return mockStorage.users.get(userId) || null;
  },

  async getUserByEmail(email: string) {
    for (const user of mockStorage.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const user = createMockUser(userData.email, userData.displayName);
    mockStorage.users.set(user.id, { ...user, ...userData });
    return user.id;
  },

  async getApiCredentialsByClientId(clientId: string) {
    for (const cred of mockStorage.credentials.values()) {
      if (cred.clientId === clientId) {
        return cred;
      }
    }
    return null;
  },

  async getUserApiCredentials(userId: string) {
    return Array.from(mockStorage.credentials.values()).filter(
      cred => cred.userId === userId
    );
  },

  async createApiCredentials(credentialsData: Omit<ApiCredentials, 'id' | 'createdAt' | 'updatedAt'>) {
    const credentials = {
      id: `cred_${nanoid(16)}`,
      ...credentialsData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStorage.credentials.set(credentials.id, credentials);
    return credentials.id;
  },

  async recordUsageStats(credentialId: string, success: boolean) {
    console.log(`📊 Usage recorded for ${credentialId}: ${success ? 'success' : 'failure'}`);
  },

  async logSecurityEvent(logData: any) {
    console.log(`🔒 Security event: ${logData.action} - ${logData.success ? 'success' : 'failure'}`);
  },
};

/**
 * Generate a complete OAuth test flow
 */
export function generateTestOAuthFlow() {
  const testData = initDevEnvironment();
  if (!testData) return null;

  const { testCredentials } = testData;
  const state = nanoid(16);
  const sessionId = generateSessionId();
  const rotationId = generateRotationId();
  const loginNumber = Date.now() % 1000000;

  // Authorization URL
  const authUrl = new URL('http://localhost:3000/api/oauth/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', testCredentials.clientId);
  authUrl.searchParams.set('redirect_uri', testCredentials.redirectUris[0]);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);

  // Session URL (as specified in requirements)
  const sessionUrl = `https://auth-GLAstudio.auth/${sessionId}/${rotationId}/${loginNumber}`;

  return {
    credentials: testCredentials,
    authorizationUrl: authUrl.toString(),
    sessionUrl,
    state,
    sessionId,
    rotationId,
    loginNumber,
    mockAuthCode: generateAuthorizationCode(),
    mockAccessToken: generateAccessToken(),
    mockRefreshToken: generateRefreshToken(),
  };
}

/**
 * Create test environment for specific scenarios
 */
export class DevTestEnvironment {
  private static instance: DevTestEnvironment;

  static getInstance(): DevTestEnvironment {
    if (!DevTestEnvironment.instance) {
      DevTestEnvironment.instance = new DevTestEnvironment();
    }
    return DevTestEnvironment.instance;
  }

  /**
   * Simulate OAuth authorization flow
   */
  async simulateOAuthFlow(clientId: string, redirectUri: string) {
    console.log('🔄 Simulating OAuth flow...');

    // Find credentials
    const credentials = await devMockImplementations.getApiCredentialsByClientId(clientId);
    if (!credentials) {
      throw new Error('Invalid client_id');
    }

    // Validate redirect URI
    if (!credentials.redirectUris.includes(redirectUri)) {
      throw new Error('Invalid redirect_uri');
    }

    // Generate session
    const sessionId = generateSessionId();
    const rotationId = generateRotationId();
    const loginNumber = Date.now() % 1000000;
    const authCode = generateAuthorizationCode();

    // Store session
    const session: OAuthSession = {
      sessionId,
      rotationId,
      loginNumber,
      userId: credentials.userId,
      credentialId: credentials.id,
      state: nanoid(16),
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };

    mockStorage.sessions.set(sessionId, session);

    console.log('✅ OAuth flow simulated successfully');
    return {
      authorizationCode: authCode,
      sessionUrl: `https://auth-GLAstudio.auth/${sessionId}/${rotationId}/${loginNumber}`,
      session,
    };
  }

  /**
   * Get mock data for testing
   */
  getMockData() {
    return {
      users: Array.from(mockStorage.users.values()),
      credentials: Array.from(mockStorage.credentials.values()),
      sessions: Array.from(mockStorage.sessions.values()),
      accessKeys: Array.from(mockStorage.accessKeys.values()),
    };
  }

  /**
   * Clear all mock data
   */
  clearMockData() {
    mockStorage.users.clear();
    mockStorage.credentials.clear();
    mockStorage.sessions.clear();
    mockStorage.accessKeys.clear();
    console.log('🧹 Mock data cleared');
  }

  /**
   * Generate test URLs for different scenarios
   */
  generateTestUrls(baseUrl: string = 'http://localhost:3000') {
    const testData = this.getMockData();
    const credentials = testData.credentials[0];

    if (!credentials) {
      console.warn('No test credentials found. Run initDevEnvironment() first.');
      return null;
    }

    return {
      // Authorization endpoint
      authorize: `${baseUrl}/api/oauth/authorize?response_type=code&client_id=${credentials.clientId}&redirect_uri=${encodeURIComponent(credentials.redirectUris[0])}&scope=openid%20profile%20email&state=test123`,

      // Token endpoint (for POST requests)
      token: `${baseUrl}/api/oauth/token`,

      // User info endpoint (requires Authorization header)
      userinfo: `${baseUrl}/api/oauth/userinfo`,

      // Dashboard
      dashboard: `${baseUrl}/dashboard`,

      // User keys management
      userKeys: `${baseUrl}/user/keys`,

      // Test credentials
      testCredentials: {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        redirectUris: credentials.redirectUris,
      },
    };
  }
}

/**
 * Quick setup function for development
 */
export function quickDevSetup() {
  if (!isDevelopmentMode) {
    console.warn('Quick dev setup is only available in development mode');
    return null;
  }

  console.log('🚀 GLAStudio OAuth - Quick Development Setup');
  console.log('==========================================');

  const testData = initDevEnvironment();
  const env = DevTestEnvironment.getInstance();
  const urls = env.generateTestUrls();

  console.log('\n📝 Environment Variables to Set:');
  console.log('Add these to your .env.local file:');
  console.log(`NEXTAUTH_SECRET=${nanoid(32)}`);
  console.log(`JWT_SECRET=${nanoid(32)}`);
  console.log(`ENCRYPTION_KEY=${nanoid(32)}`);

  console.log('\n🔗 Test URLs:');
  if (urls) {
    console.log(`Authorization: ${urls.authorize}`);
    console.log(`Dashboard: ${urls.dashboard}`);
    console.log(`User Keys: ${urls.userKeys}`);
  }

  console.log('\n📋 Test Credentials:');
  if (urls?.testCredentials) {
    console.log(`Client ID: ${urls.testCredentials.clientId}`);
    console.log(`Client Secret: ${urls.testCredentials.clientSecret}`);
    console.log(`Redirect URIs: ${urls.testCredentials.redirectUris.join(', ')}`);
  }

  console.log('\n💡 Quick Test Commands:');
  console.log('1. Test Authorization:');
  console.log(`   curl "${urls?.authorize}"`);
  console.log('\n2. Test Token Exchange (after getting auth code):');
  console.log(`   curl -X POST ${urls?.token} \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"grant_type":"authorization_code","client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET","code":"AUTH_CODE","redirect_uri":"YOUR_REDIRECT_URI"}\'');

  console.log('\n🎯 Next Steps:');
  console.log('1. Set up Firebase Admin SDK credentials (optional for testing)');
  console.log('2. Configure a tunnel (ngrok, cloudflare, etc.) for external testing');
  console.log('3. Update Firebase authorized domains with your tunnel URL');
  console.log('4. Test the full OAuth flow with your application');

  return {
    testData,
    environment: env,
    urls,
  };
}

/**
 * Environment checker
 */
export function checkEnvironment() {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  const requiredClientVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  const optionalServerVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
  ];

  requiredClientVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push(`Missing required environment variable: ${varName}`);
    }
  });

  optionalServerVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`Missing optional server environment variable: ${varName} (limits server-side features)`);
    }
  });

  if (!process.env.NEXTAUTH_SECRET) {
    warnings.push('Missing NEXTAUTH_SECRET (will use default, not secure for production)');
  }

  if (!process.env.JWT_SECRET) {
    warnings.push('Missing JWT_SECRET (will use default, not secure for production)');
  }

  console.log('🔍 Environment Check Results:');

  if (issues.length === 0) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
}

// Export singleton instance
export const devEnv = DevTestEnvironment.getInstance();

// Auto-initialize in development mode
if (isDevelopmentMode && typeof window === 'undefined') {
  // Only run on server-side to avoid running in browser
  console.log('🔧 Development mode detected');

  // Check if we should auto-initialize
  if (process.env.AUTO_INIT_DEV !== 'false') {
    try {
      quickDevSetup();
    } catch (error) {
      console.warn('Could not auto-initialize dev environment:', error);
    }
  }
}

export default {
  isDevelopmentMode,
  initDevEnvironment,
  createMockUser,
  createMockCredentials,
  createMockAccessKey,
  generateTestOAuthFlow,
  DevTestEnvironment,
  quickDevSetup,
  checkEnvironment,
  devEnv,
  mockImplementations: devMockImplementations,
};

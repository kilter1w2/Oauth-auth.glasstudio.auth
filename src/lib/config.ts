// Application Configuration Constants
// This file centralizes all configuration values used throughout the OAuth system

import { OAuthScope } from '@/types';

// =============================================================================
// APPLICATION METADATA
// =============================================================================

export const APP_CONFIG = {
  name: 'GLAStudio OAuth',
  version: '1.0.0',
  description: 'Secure OAuth 2.0 authentication service for developers',
  domain: process.env.APP_DOMAIN || 'auth-GLAstudio.auth',
  url: process.env.APP_URL || 'http://localhost:3000',
  supportEmail: 'support@glasstudio.auth',
  docsUrl: 'https://docs.glasstudio.auth',
} as const;

// =============================================================================
// API ENDPOINTS AND PATHS
// =============================================================================

export const API_PATHS = {
  // OAuth 2.0 endpoints
  oauth: {
    authorize: '/api/oauth/authorize',
    token: '/api/oauth/token',
    userinfo: '/api/oauth/userinfo',
    revoke: '/api/oauth/revoke',
  },

  // Authentication endpoints
  auth: {
    login: '/auth/login',
    callback: '/auth/callback',
    complete: '/api/auth/complete',
    logout: '/auth/logout',
  },

  // API management endpoints
  api: {
    credentials: '/api/credentials',
    stats: '/api/dashboard/stats',
    usage: '/api/usage',
    logs: '/api/logs',
  },

  // Public pages
  pages: {
    dashboard: '/dashboard',
    docs: '/docs',
    pricing: '/pricing',
    support: '/support',
    terms: '/terms',
    privacy: '/privacy',
  },
} as const;

// =============================================================================
// OAUTH 2.0 CONFIGURATION
// =============================================================================

export const OAUTH_CONFIG = {
  // Supported grant types
  grantTypes: [
    'authorization_code',
    'refresh_token',
  ] as const,

  // Supported response types
  responseTypes: [
    'code',
  ] as const,

  // Supported PKCE methods
  pkceMethods: [
    'S256',
    'plain',
  ] as const,

  // Default and supported scopes
  scopes: {
    default: ['openid', 'profile', 'email'] as OAuthScope[],
    supported: [
      'openid',
      'profile',
      'email',
      'read:user',
      'write:user',
    ] as OAuthScope[],

    // Scope descriptions for UI
    descriptions: {
      openid: 'Basic profile identification',
      profile: 'Your profile information (name, photo)',
      email: 'Your email address',
      'read:user': 'Read your user data',
      'write:user': 'Modify your user data',
    } as Record<OAuthScope, string>,
  },

  // Token configuration
  tokens: {
    authorizationCode: {
      length: 32,
      expiryMinutes: 10,
    },
    accessToken: {
      length: 32,
      expiryHours: 1,
    },
    refreshToken: {
      length: 32,
      expiryDays: 30,
    },
  },

  // Session configuration
  session: {
    expiryMinutes: 10,
    sessionIdLength: 16, // 128-bit as specified
    rotationIdLength: 16,
  },
} as const;

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================

export const RATE_LIMIT_CONFIG = {
  // Default rate limits
  defaults: {
    api: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    },
    global: {
      maxRequests: 1000,
      windowMs: 3600000, // 1 hour
    },
    user: {
      maxRequests: 500,
      windowMs: 3600000, // 1 hour
    },
    credentialCreation: {
      maxRequests: 10,
      windowMs: 3600000, // 1 hour
    },
  },

  // Per-operation limits
  operations: {
    authorize: {
      maxRequests: 100,
      windowMs: 900000, // 15 minutes
    },
    token: {
      maxRequests: 200,
      windowMs: 900000, // 15 minutes
    },
    userinfo: {
      maxRequests: 500,
      windowMs: 900000, // 15 minutes
    },
  },

  // Limits validation
  validation: {
    maxRequests: {
      min: 1,
      max: 10000,
    },
    windowMs: {
      min: 60000, // 1 minute
      max: 86400000, // 24 hours
    },
  },
} as const;

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

export const SECURITY_CONFIG = {
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256' as const,
  },

  // Encryption configuration
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
    algorithm: 'AES' as const,
  },

  // Password requirements
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    saltRounds: 12,
  },

  // Session security
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800', 10), // 7 days
    updateAge: parseInt(process.env.SESSION_UPDATE_AGE || '86400', 10), // 1 day
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },

  // CORS settings
  cors: {
    origins: process.env.NODE_ENV === 'production'
      ? [APP_CONFIG.url, `https://${APP_CONFIG.domain}`]
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  },
} as const;

// =============================================================================
// VALIDATION RULES
// =============================================================================

export const VALIDATION_RULES = {
  // Application name validation
  applicationName: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
  },

  // Description validation
  description: {
    maxLength: 500,
  },

  // URI validation
  uri: {
    maxLength: 2048,
    schemes: ['http', 'https'],
    // Allow localhost for development
    allowLocalhost: process.env.NODE_ENV === 'development',
  },

  // Client ID format
  clientId: {
    prefix: 'gla_',
    length: 35, // prefix + 32 characters
    pattern: /^gla_[a-zA-Z0-9_-]{32}$/,
  },

  // API Key format
  apiKey: {
    prefix: 'gla_api_',
    length: 48, // prefix + 40 characters
    pattern: /^gla_api_[a-zA-Z0-9_-]{40}$/,
  },

  // Email validation
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
  },
} as const;

// =============================================================================
// ERROR CODES AND MESSAGES
// =============================================================================

export const ERROR_CODES = {
  // OAuth 2.0 standard errors
  oauth: {
    invalid_request: 'The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.',
    unauthorized_client: 'The client is not authorized to request an authorization code using this method.',
    access_denied: 'The resource owner or authorization server denied the request.',
    unsupported_response_type: 'The authorization server does not support obtaining an authorization code using this method.',
    invalid_scope: 'The requested scope is invalid, unknown, or malformed.',
    server_error: 'The authorization server encountered an unexpected condition that prevented it from fulfilling the request.',
    temporarily_unavailable: 'The authorization server is currently unable to handle the request due to a temporary overloading or maintenance of the server.',
    invalid_client: 'Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).',
    invalid_grant: 'The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.',
    unsupported_grant_type: 'The authorization grant type is not supported by the authorization server.',
    invalid_token: 'The access token provided is expired, revoked, malformed, or invalid for other reasons.',
    insufficient_scope: 'The request requires higher privileges than provided by the access token.',
  },

  // Application-specific errors
  app: {
    user_not_found: 'User not found',
    session_expired: 'Session has expired',
    rate_limit_exceeded: 'Rate limit exceeded. Please try again later.',
    invalid_credentials: 'Invalid credentials provided',
    internal_error: 'Internal server error occurred',
  },
} as const;

// =============================================================================
// DATABASE COLLECTIONS
// =============================================================================

export const DB_COLLECTIONS = {
  users: 'users',
  apiCredentials: 'api_credentials',
  oauthSessions: 'oauth_sessions',
  authorizationCodes: 'authorization_codes',
  accessTokens: 'access_tokens',
  refreshTokens: 'refresh_tokens',
  usageStats: 'usage_stats',
  securityLogs: 'security_logs',
} as const;

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export const CACHE_CONFIG = {
  // TTL values in seconds
  ttl: {
    userInfo: 300, // 5 minutes
    credentials: 600, // 10 minutes
    stats: 60, // 1 minute
    rateLimits: 300, // 5 minutes
  },

  // Cache keys prefixes
  keys: {
    user: 'user:',
    credentials: 'cred:',
    session: 'sess:',
    rateLimit: 'rl:',
    stats: 'stats:',
  },
} as const;

// =============================================================================
// MONITORING AND LOGGING
// =============================================================================

export const MONITORING_CONFIG = {
  // Log levels
  logLevels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  } as const,

  // Current log level based on environment
  currentLogLevel: process.env.NODE_ENV === 'production' ? 2 : 3,

  // Security event types
  securityEventTypes: [
    'oauth_authorize',
    'oauth_token',
    'oauth_userinfo',
    'auth_complete',
    'credentials_create',
    'credentials_list',
    'credentials_update',
    'credentials_delete',
    'rate_limit_exceeded',
    'invalid_request',
    'authentication_failed',
  ] as const,

  // Metrics to track
  metrics: [
    'requests_total',
    'requests_successful',
    'requests_failed',
    'response_time',
    'active_sessions',
    'tokens_issued',
    'rate_limits_hit',
  ] as const,
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURE_FLAGS = {
  // OAuth features
  enablePKCE: true,
  enableRefreshTokens: true,
  enableWebhooks: false,

  // Security features
  enableRateLimiting: true,
  enableSecurityLogging: true,
  enableCORS: true,

  // UI features
  enableDashboard: true,
  enableAnalytics: true,
  enableRealTimeStats: false,

  // Development features
  enableDebugLogging: process.env.NODE_ENV === 'development',
  enableTestMode: process.env.NODE_ENV === 'test',
} as const;

// =============================================================================
// ENVIRONMENT HELPERS
// =============================================================================

export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ApiPath = typeof API_PATHS[keyof typeof API_PATHS][keyof typeof API_PATHS[keyof typeof API_PATHS]];
export type GrantType = typeof OAUTH_CONFIG.grantTypes[number];
export type ResponseType = typeof OAUTH_CONFIG.responseTypes[number];
export type PKCEMethod = typeof OAUTH_CONFIG.pkceMethods[number];
export type SecurityEventType = typeof MONITORING_CONFIG.securityEventTypes[number];
export type MetricType = typeof MONITORING_CONFIG.metrics[number];

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  APP_CONFIG,
  API_PATHS,
  OAUTH_CONFIG,
  RATE_LIMIT_CONFIG,
  SECURITY_CONFIG,
  VALIDATION_RULES,
  ERROR_CODES,
  DB_COLLECTIONS,
  CACHE_CONFIG,
  MONITORING_CONFIG,
  FEATURE_FLAGS,
  ENV,
} as const;

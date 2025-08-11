// User Management Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: "google" | "email";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  metadata?: {
    lastSignInTime?: Date;
    creationTime?: Date;
    lastRefreshTime?: Date;
  };
}

// Developer API Credentials
export interface ApiCredentials {
  id: string;
  userId: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  name: string;
  description?: string;
  redirectUris: string[];
  allowedOrigins: string[];
  scopes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  rateLimit: RateLimitConfig;
}

// Rate Limiting Configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  enabled: boolean;
}

// Rate Limiting Usage Tracking
export interface UsageStats {
  credentialId: string;
  date: string; // YYYY-MM-DD format
  requests: number;
  errors: number;
  successfulAuths: number;
  failedAuths: number;
  lastRequest?: Date;
}

// OAuth Session Management
export interface OAuthSession {
  sessionId: string; // 128-bit decoded ID
  rotationId: string; // Developer website rotation ID
  loginNumber: number; // Current login number
  userId: string;
  credentialId: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  redirectUri: string;
  scopes: string[];
  status: "pending" | "authorized" | "expired" | "revoked";
  createdAt: Date;
  expiresAt: Date;
  authorizedAt?: Date;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

// Authorization Code
export interface AuthorizationCode {
  code: string;
  sessionId: string;
  userId: string;
  credentialId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

// Access Token
export interface AccessToken {
  token: string;
  userId: string;
  credentialId: string;
  sessionId: string;
  scopes: string[];
  tokenType: "Bearer";
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}

// Refresh Token
export interface RefreshToken {
  token: string;
  userId: string;
  credentialId: string;
  sessionId: string;
  accessTokenId: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  replacedBy?: string;
}

// OAuth Scopes
export type OAuthScope =
  | "profile"
  | "email"
  | "openid"
  | "read:user"
  | "write:user";

// API Request/Response Types
export interface AuthorizeRequest {
  response_type: "code";
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: "S256" | "plain";
}

export interface AuthorizeResponse {
  code: string;
  state: string;
  session_url: string; // https://auth-GLAstudio.auth/{session-id}/{rotation-id}/{login-number}
}

export interface TokenRequest {
  grant_type: "authorization_code" | "refresh_token";
  code?: string;
  refresh_token?: string;
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  code_verifier?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface UserInfoResponse {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

// Error Types
export interface OAuthError {
  error:
    | "invalid_request"
    | "unauthorized_client"
    | "access_denied"
    | "unsupported_response_type"
    | "invalid_scope"
    | "server_error"
    | "temporarily_unavailable"
    | "invalid_client"
    | "invalid_grant"
    | "unsupported_grant_type";
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// Dashboard Analytics
export interface DashboardStats {
  totalUsers: number;
  activeCredentials: number;
  totalRequests24h: number;
  totalRequests7d: number;
  totalRequests30d: number;
  successRate: number;
  topCredentials: Array<{
    id: string;
    name: string;
    requests: number;
    successRate: number;
  }>;
  recentActivity: Array<{
    timestamp: Date;
    credentialId: string;
    credentialName: string;
    action: "authorize" | "token" | "userinfo" | "error";
    status: "success" | "error";
    ip?: string;
  }>;
}

// Form Types for Frontend
export interface CreateCredentialForm {
  name: string;
  description?: string;
  redirectUris: string;
  allowedOrigins: string;
  scopes: OAuthScope[];
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface UpdateCredentialForm extends Partial<CreateCredentialForm> {
  id: string;
  isActive?: boolean;
}

// Firebase Document Types
export interface FirestoreUser extends Omit<User, "createdAt" | "updatedAt"> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface FirestoreApiCredentials
  extends Omit<ApiCredentials, "createdAt" | "updatedAt" | "lastUsed"> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastUsed?: FirebaseFirestore.Timestamp;
}

export interface FirestoreOAuthSession
  extends Omit<
    OAuthSession,
    "createdAt" | "expiresAt" | "authorizedAt" | "tokenExpiresAt"
  > {
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  authorizedAt?: FirebaseFirestore.Timestamp;
  tokenExpiresAt?: FirebaseFirestore.Timestamp;
}

// API Response Wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Rate Limiting Types
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

// Session URL Components
export interface SessionUrlComponents {
  sessionId: string; // 128-bit decoded ID
  rotationId: string; // Developer website rotation ID
  loginNumber: number; // Current login number
}

// Webhook Types (for future extension)
export interface WebhookEvent {
  id: string;
  type: "user.authorized" | "token.created" | "token.revoked";
  credentialId: string;
  userId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// Security Types
export interface SecurityLog {
  id: string;
  userId?: string;
  credentialId?: string;
  action: string;
  ip: string;
  userAgent: string;
  success: boolean;
  error?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

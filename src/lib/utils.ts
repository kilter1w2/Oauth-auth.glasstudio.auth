import jwt from "jsonwebtoken";
import crypto from "crypto";
import { nanoid } from "nanoid";
import CryptoJS from "crypto-js";
import { OAuthScope, SessionUrlComponents, RateLimitResult } from "@/types";

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Encryption Configuration
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "your-32-character-encryption-key";

// OAuth Configuration
const APP_DOMAIN = process.env.APP_DOMAIN || "auth-GLAstudio.auth";

/**
 * JWT Token Management
 */
export const generateJWT = (
  payload: object,
  expiresIn: string = JWT_EXPIRES_IN,
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyJWT = <T = unknown>(token: string): T | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};

export const decodeJWT = <T = unknown>(token: string): T | null => {
  try {
    return jwt.decode(token) as T;
  } catch (error) {
    console.error("JWT decode failed:", error);
    return null;
  }
};

/**
 * Encryption/Decryption
 */
export const encrypt = (text: string): string => {
  const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  return encrypted;
};

export const decrypt = (encryptedText: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
};

/**
 * Secure Random ID Generation
 */
export const generateClientId = (): string => {
  return `gla_${nanoid(32)}`;
};

export const generateClientSecret = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateApiKey = (): string => {
  return `gla_api_${nanoid(40)}`;
};

export const generateSessionId = (): string => {
  // 128-bit decoded ID as specified
  return crypto.randomBytes(16).toString("hex");
};

export const generateRotationId = (): string => {
  return nanoid(16);
};

export const generateAuthorizationCode = (): string => {
  return nanoid(32);
};

export const generateAccessToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateState = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * PKCE (Proof Key for Code Exchange) Support
 */
export const generateCodeVerifier = (): string => {
  return crypto.randomBytes(32).toString("base64url");
};

export const generateCodeChallenge = (verifier: string): string => {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
};

export const verifyCodeChallenge = (
  verifier: string,
  challenge: string,
): boolean => {
  const computedChallenge = generateCodeChallenge(verifier);
  return computedChallenge === challenge;
};

/**
 * Session URL Generation
 */
export const generateSessionUrl = (
  components: SessionUrlComponents,
): string => {
  const { sessionId, rotationId, loginNumber } = components;
  return `https://${APP_DOMAIN}/${sessionId}/${rotationId}/${loginNumber}`;
};

export const parseSessionUrl = (url: string): SessionUrlComponents | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    if (pathParts.length !== 3) {
      return null;
    }

    const [sessionId, rotationId, loginNumberStr] = pathParts;
    const loginNumber = parseInt(loginNumberStr, 10);

    if (isNaN(loginNumber)) {
      return null;
    }

    return {
      sessionId,
      rotationId,
      loginNumber,
    };
  } catch {
    return null;
  }
};

/**
 * OAuth Scope Validation
 */
export const validateScopes = (requestedScopes: string[]): OAuthScope[] => {
  const validScopes: OAuthScope[] = [
    "profile",
    "email",
    "openid",
    "read:user",
    "write:user",
  ];
  return requestedScopes.filter((scope) =>
    validScopes.includes(scope as OAuthScope),
  ) as OAuthScope[];
};

export const scopesToString = (scopes: OAuthScope[]): string => {
  return scopes.join(" ");
};

export const stringToScopes = (scopeString: string): OAuthScope[] => {
  return validateScopes(scopeString.split(" ").filter(Boolean));
};

/**
 * URL Validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidRedirectUri = (
  uri: string,
  allowedUris: string[],
): boolean => {
  if (!isValidUrl(uri)) {
    return false;
  }

  // Exact match or wildcard match
  return allowedUris.some((allowedUri) => {
    if (allowedUri === uri) {
      return true;
    }

    // Support wildcard matching for subdomains
    if (allowedUri.includes("*")) {
      const pattern = allowedUri.replace(/\*/g, ".*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(uri);
    }

    return false;
  });
};

/**
 * Rate Limiting Utilities
 */
export const calculateRateLimit = (
  requests: number,
  windowStart: Date,
  maxRequests: number,
  windowMs: number,
): RateLimitResult => {
  const now = new Date();
  const windowEnd = new Date(windowStart.getTime() + windowMs);

  if (now > windowEnd) {
    // Window has expired, reset
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: new Date(now.getTime() + windowMs),
      limit: maxRequests,
    };
  }

  const allowed = requests < maxRequests;
  const remaining = Math.max(0, maxRequests - requests - (allowed ? 1 : 0));

  return {
    allowed,
    remaining,
    resetTime: windowEnd,
    limit: maxRequests,
  };
};

/**
 * Data Validation
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateClientId = (clientId: string): boolean => {
  return /^gla_[a-zA-Z0-9_-]{32}$/.test(clientId);
};

export const validateApiKey = (apiKey: string): boolean => {
  return /^gla_api_[a-zA-Z0-9_-]{40}$/.test(apiKey);
};

/**
 * Time Utilities
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

export const addHours = (date: Date, hours: number): Date => {
  return new Date(date.getTime() + hours * 3600000);
};

export const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 86400000);
};

export const isExpired = (expiryDate: Date): boolean => {
  return new Date() > expiryDate;
};

/**
 * Error Handling
 */
export const createOAuthError = (
  error: string,
  description?: string,
  state?: string,
): { error: string; error_description?: string; state?: string } => {
  const errorResponse: {
    error: string;
    error_description?: string;
    state?: string;
  } = { error };

  if (description) {
    errorResponse.error_description = description;
  }

  if (state) {
    errorResponse.state = state;
  }

  return errorResponse;
};

/**
 * Request Utilities
 */
export const getClientIpAddress = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
};

export const getUserAgent = (request: Request): string => {
  return request.headers.get("user-agent") || "unknown";
};

/**
 * Password Utilities (for future email/password auth)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import("bcryptjs");
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
};

/**
 * API Response Utilities
 */
export const createSuccessResponse = <T>(data: T, message?: string) => {
  return {
    success: true,
    data,
    message,
  };
};

export const createErrorResponse = (error: string, message?: string) => {
  return {
    success: false,
    error,
    message,
  };
};

/**
 * Logging Utilities
 */
export const createSecurityLogData = (
  action: string,
  success: boolean,
  request: Request,
  userId?: string,
  credentialId?: string,
  error?: string,
  metadata?: Record<string, unknown>,
) => {
  return {
    action,
    success,
    ip: getClientIpAddress(request),
    userAgent: getUserAgent(request),
    userId,
    credentialId,
    error,
    metadata,
  };
};

/**
 * Development Utilities
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

/**
 * Sanitization
 */
export const sanitizeRedirectUris = (uris: string): string[] => {
  return uris
    .split(",")
    .map((uri) => uri.trim())
    .filter((uri) => uri.length > 0 && isValidUrl(uri));
};

export const sanitizeAllowedOrigins = (origins: string): string[] => {
  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

/**
 * Export all utilities as default
 */
const utils = {
  generateJWT,
  verifyJWT,
  decodeJWT,
  encrypt,
  decrypt,
  generateClientId,
  generateClientSecret,
  generateApiKey,
  generateSessionId,
  generateRotationId,
  generateAuthorizationCode,
  generateAccessToken,
  generateRefreshToken,
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  verifyCodeChallenge,
  generateSessionUrl,
  parseSessionUrl,
  validateScopes,
  scopesToString,
  stringToScopes,
  isValidUrl,
  isValidRedirectUri,
  calculateRateLimit,
  validateEmail,
  validateClientId,
  validateApiKey,
  addMinutes,
  addHours,
  addDays,
  isExpired,
  createOAuthError,
  getClientIpAddress,
  getUserAgent,
  hashPassword,
  verifyPassword,
  createSuccessResponse,
  createErrorResponse,
  createSecurityLogData,
  isDevelopment,
  isProduction,
  sanitizeRedirectUris,
  sanitizeAllowedOrigins,
};

export default utils;

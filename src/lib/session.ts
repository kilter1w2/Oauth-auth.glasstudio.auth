import { User as FirebaseUser } from "firebase/auth";
import CryptoJS from "crypto-js";

// Session configuration
const SESSION_CONFIG = {
  sessionCookieName: "glasstudio_session",
  refreshCookieName: "glasstudio_refresh",
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  refreshDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

// Session data interface
export interface SessionData {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: "google" | "email";
  emailVerified: boolean;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  sessionId: string;
}

// Session token interface
export interface SessionToken {
  sessionId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  type: "session" | "refresh";
}

// Client-side session management
export class SessionManager {
  private static instance: SessionManager;
  private sessionData: SessionData | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Generate secure session ID
  private generateSessionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return CryptoJS.SHA256(timestamp + random).toString();
  }

  // Get session secret with fallback
  private getSessionSecret(): string {
    const secret =
      process.env.NEXT_PUBLIC_SESSION_SECRET ||
      process.env.SESSION_SECRET ||
      "glasstudio-default-secret-key-2024";

    if (typeof window !== "undefined" && secret.includes("default")) {
      console.warn(
        "Using default session secret. Please set NEXT_PUBLIC_SESSION_SECRET in production.",
      );
    }

    return secret;
  }

  // Encrypt session data
  private encryptData(data: string): string {
    try {
      const secretKey = this.getSessionSecret();
      return CryptoJS.AES.encrypt(data, secretKey).toString();
    } catch (error) {
      console.error("Session encryption error:", error);
      throw new Error("Failed to encrypt session data");
    }
  }

  // Decrypt session data
  private decryptData(encryptedData: string): string {
    try {
      const secretKey = this.getSessionSecret();
      const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        throw new Error("Decryption resulted in empty string");
      }

      return decrypted;
    } catch (error) {
      console.error("Session decryption error:", error);
      throw new Error("Failed to decrypt session data");
    }
  }

  // Debug session information
  private debugSession(message: string, data?: any): void {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      console.log(`[SessionManager] ${message}`, data);
    }
  }

  // Create session from Firebase user
  createSession(user: FirebaseUser): SessionData {
    try {
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + SESSION_CONFIG.sessionDuration,
      );

      const sessionData: SessionData = {
        userId: user.uid,
        email: user.email || "",
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        provider:
          user.providerData[0]?.providerId === "google.com"
            ? "google"
            : "email",
        emailVerified: user.emailVerified,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastActivity: now.toISOString(),
        sessionId: this.generateSessionId(),
      };

      this.debugSession("Creating new session", {
        userId: user.uid,
        email: user.email,
      });

      this.sessionData = sessionData;
      this.saveSessionToCookies(sessionData);
      this.startRefreshTimer();

      this.debugSession("Session created successfully", {
        sessionId: sessionData.sessionId,
      });

      return sessionData;
    } catch (error) {
      console.error("Failed to create session:", error);
      throw error;
    }
  }

  // Save session to cookies (client-side)
  private saveSessionToCookies(sessionData: SessionData): void {
    if (typeof window === "undefined") return;

    const encryptedSession = this.encryptData(JSON.stringify(sessionData));
    const sessionToken: SessionToken = {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      issuedAt: Date.now(),
      expiresAt: new Date(sessionData.expiresAt).getTime(),
      type: "session",
    };

    const refreshToken: SessionToken = {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + SESSION_CONFIG.refreshDuration,
      type: "refresh",
    };

    // Set session cookie
    document.cookie = `${SESSION_CONFIG.sessionCookieName}=${encryptedSession}; max-age=${SESSION_CONFIG.sessionDuration / 1000}; path=/; ${SESSION_CONFIG.cookieOptions.secure ? "secure;" : ""} samesite=${SESSION_CONFIG.cookieOptions.sameSite}`;

    // Set refresh token cookie
    const encryptedRefresh = this.encryptData(JSON.stringify(refreshToken));
    document.cookie = `${SESSION_CONFIG.refreshCookieName}=${encryptedRefresh}; max-age=${SESSION_CONFIG.refreshDuration / 1000}; path=/; ${SESSION_CONFIG.cookieOptions.secure ? "secure;" : ""} samesite=${SESSION_CONFIG.cookieOptions.sameSite}`;
  }

  // Get session from cookies
  getSessionFromCookies(): SessionData | null {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    const sessionCookie = cookies[SESSION_CONFIG.sessionCookieName];
    if (!sessionCookie) return null;

    try {
      const decryptedSession = this.decryptData(sessionCookie);
      const sessionData: SessionData = JSON.parse(decryptedSession);

      // Check if session is expired
      if (new Date(sessionData.expiresAt) < new Date()) {
        this.clearSession();
        return null;
      }

      // Update last activity
      sessionData.lastActivity = new Date().toISOString();
      this.sessionData = sessionData;
      this.saveSessionToCookies(sessionData);

      return sessionData;
    } catch (error) {
      console.error("Failed to parse session cookie:", error);
      this.clearSession();
      return null;
    }
  }

  // Get current session
  getCurrentSession(): SessionData | null {
    if (this.sessionData) {
      // Check if current session is still valid
      if (new Date(this.sessionData.expiresAt) > new Date()) {
        return this.sessionData;
      }
    }

    // Try to get from cookies
    return this.getSessionFromCookies();
  }

  // Refresh session
  async refreshSession(): Promise<SessionData | null> {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    const refreshCookie = cookies[SESSION_CONFIG.refreshCookieName];
    if (!refreshCookie) return null;

    try {
      const decryptedRefresh = this.decryptData(refreshCookie);
      const refreshToken: SessionToken = JSON.parse(decryptedRefresh);

      // Check if refresh token is expired
      if (refreshToken.expiresAt < Date.now()) {
        this.clearSession();
        return null;
      }

      // Call API to refresh session
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { sessionData } = await response.json();
        this.sessionData = sessionData;
        this.saveSessionToCookies(sessionData);
        return sessionData;
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }

    this.clearSession();
    return null;
  }

  // Clear session
  clearSession(): void {
    this.sessionData = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (typeof window !== "undefined") {
      // Clear cookies
      document.cookie = `${SESSION_CONFIG.sessionCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${SESSION_CONFIG.refreshCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }

  // Start automatic session refresh
  private startRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh session 5 minutes before expiration
    const refreshTime = SESSION_CONFIG.sessionDuration - 5 * 60 * 1000;
    this.refreshTimer = setTimeout(async () => {
      await this.refreshSession();
      this.startRefreshTimer();
    }, refreshTime);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const session = this.getCurrentSession();
    return session !== null;
  }

  // Get user info from session
  getCurrentUser(): Partial<FirebaseUser> | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    return {
      uid: session.userId,
      email: session.email,
      displayName: session.displayName,
      photoURL: session.photoURL,
      emailVerified: session.emailVerified,
    };
  }

  // Update session activity
  updateActivity(): void {
    if (this.sessionData) {
      this.sessionData.lastActivity = new Date().toISOString();
      this.saveSessionToCookies(this.sessionData);
    }
  }
}

// Server-side session utilities
export class ServerSessionManager {
  // Get server session secret
  private static getServerSecret(): string {
    return (
      process.env.SESSION_SECRET ||
      process.env.NEXT_PUBLIC_SESSION_SECRET ||
      "glasstudio-default-secret-key-2024"
    );
  }

  // Verify session token
  static verifySessionToken(token: string): SessionData | null {
    try {
      const secretKey = this.getServerSecret();
      const bytes = CryptoJS.AES.decrypt(token, secretKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedData) {
        console.error("Session token decryption failed - empty result");
        return null;
      }

      const sessionData: SessionData = JSON.parse(decryptedData);

      // Check if session is expired
      if (new Date(sessionData.expiresAt) < new Date()) {
        console.log("Session expired:", sessionData.expiresAt);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error("Failed to verify session token:", error);
      return null;
    }
  }

  // Create session token
  static createSessionToken(sessionData: SessionData): string {
    try {
      const secretKey = this.getServerSecret();
      return CryptoJS.AES.encrypt(
        JSON.stringify(sessionData),
        secretKey,
      ).toString();
    } catch (error) {
      console.error("Failed to create session token:", error);
      throw error;
    }
  }

  // Get session from request headers
  static getSessionFromRequest(req: Request): SessionData | null {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    const sessionToken = cookies[SESSION_CONFIG.sessionCookieName];
    if (!sessionToken) return null;

    return this.verifySessionToken(sessionToken);
  }

  // Set session cookies in response
  static setSessionCookies(sessionData: SessionData): string[] {
    const sessionToken = this.createSessionToken(sessionData);
    const refreshToken: SessionToken = {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + SESSION_CONFIG.refreshDuration,
      type: "refresh",
    };

    const encryptedRefresh = CryptoJS.AES.encrypt(
      JSON.stringify(refreshToken),
      this.getServerSecret(),
    ).toString();

    const sessionCookie = `${SESSION_CONFIG.sessionCookieName}=${sessionToken}; Max-Age=${SESSION_CONFIG.sessionDuration / 1000}; Path=/; ${SESSION_CONFIG.cookieOptions.httpOnly ? "HttpOnly;" : ""} ${SESSION_CONFIG.cookieOptions.secure ? "Secure;" : ""} SameSite=${SESSION_CONFIG.cookieOptions.sameSite}`;

    const refreshCookie = `${SESSION_CONFIG.refreshCookieName}=${encryptedRefresh}; Max-Age=${SESSION_CONFIG.refreshDuration / 1000}; Path=/; ${SESSION_CONFIG.cookieOptions.httpOnly ? "HttpOnly;" : ""} ${SESSION_CONFIG.cookieOptions.secure ? "Secure;" : ""} SameSite=${SESSION_CONFIG.cookieOptions.sameSite}`;

    return [sessionCookie, refreshCookie];
  }

  // Clear session cookies
  static clearSessionCookies(): string[] {
    const sessionCookie = `${SESSION_CONFIG.sessionCookieName}=; Max-Age=0; Path=/;`;
    const refreshCookie = `${SESSION_CONFIG.refreshCookieName}=; Max-Age=0; Path=/;`;
    return [sessionCookie, refreshCookie];
  }
}

// React hook for session management
export function useSession() {
  const sessionManager = SessionManager.getInstance();

  const getSession = () => sessionManager.getCurrentSession();
  const clearSession = () => sessionManager.clearSession();
  const isAuthenticated = () => sessionManager.isAuthenticated();
  const getCurrentUser = () => sessionManager.getCurrentUser();
  const updateActivity = () => sessionManager.updateActivity();

  return {
    getSession,
    clearSession,
    isAuthenticated,
    getCurrentUser,
    updateActivity,
    sessionManager,
  };
}

// Middleware function for protecting routes
export function withAuth(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const session = ServerSessionManager.getSessionFromRequest(req);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Add session to request context
    (req as any).session = session;
    return handler(req, ...args);
  };
}

// Export configuration and utilities
export { SESSION_CONFIG };
export default SessionManager;

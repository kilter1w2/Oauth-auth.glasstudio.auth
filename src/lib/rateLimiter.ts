import { RateLimitResult, ApiCredentials } from "@/types";
import { calculateRateLimit } from "@/lib/utils";

interface RateLimitEntry {
  requests: number;
  windowStart: Date;
  lastRequest: Date;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  enabled: boolean;
}

interface RateLimitOptions extends RateLimitConfig {
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;
  private defaultConfig: RateLimitConfig;

  constructor(defaultConfig?: Partial<RateLimitConfig>) {
    this.defaultConfig = {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
      enabled: true,
      ...defaultConfig,
    };

    // Start cleanup interval (run every 5 minutes)
    this.startCleanup();
  }

  /**
   * Check if a request should be rate limited
   */
  public async checkRateLimit(
    identifier: string,
    config?: Partial<RateLimitOptions>,
  ): Promise<RateLimitResult> {
    const options = { ...this.defaultConfig, ...config };

    if (!options.enabled) {
      return {
        allowed: true,
        remaining: options.maxRequests,
        resetTime: new Date(Date.now() + options.windowMs),
        limit: options.maxRequests,
      };
    }

    const key = options.keyGenerator
      ? options.keyGenerator(identifier)
      : identifier;
    const now = new Date();

    // Get or create rate limit entry
    let entry = this.store[key];

    if (!entry || this.isWindowExpired(entry, options.windowMs)) {
      // Create new or reset expired entry
      entry = {
        requests: 0,
        windowStart: now,
        lastRequest: now,
      };
      this.store[key] = entry;
    }

    // Calculate rate limit result
    const result = calculateRateLimit(
      entry.requests,
      entry.windowStart,
      options.maxRequests,
      options.windowMs,
    );

    // Update entry if request is allowed
    if (result.allowed) {
      entry.requests += 1;
      entry.lastRequest = now;
    }

    return result;
  }

  /**
   * Record a request for rate limiting
   */
  public async recordRequest(
    identifier: string,
    success: boolean = true,
    config?: Partial<RateLimitOptions>,
  ): Promise<void> {
    const options = { ...this.defaultConfig, ...config };

    if (!options.enabled) {
      return;
    }

    // Skip recording based on configuration
    if (success && options.skipSuccessfulRequests) {
      return;
    }

    if (!success && options.skipFailedRequests) {
      return;
    }

    const key = options.keyGenerator
      ? options.keyGenerator(identifier)
      : identifier;
    const now = new Date();

    let entry = this.store[key];

    if (!entry || this.isWindowExpired(entry, options.windowMs)) {
      entry = {
        requests: 1,
        windowStart: now,
        lastRequest: now,
      };
      this.store[key] = entry;
    } else {
      entry.requests += 1;
      entry.lastRequest = now;
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  public async getRateLimitStatus(
    identifier: string,
    config?: Partial<RateLimitOptions>,
  ): Promise<RateLimitResult> {
    const options = { ...this.defaultConfig, ...config };
    const key = options.keyGenerator
      ? options.keyGenerator(identifier)
      : identifier;

    const entry = this.store[key];

    if (!entry || this.isWindowExpired(entry, options.windowMs)) {
      return {
        allowed: true,
        remaining: options.maxRequests,
        resetTime: new Date(Date.now() + options.windowMs),
        limit: options.maxRequests,
      };
    }

    return calculateRateLimit(
      entry.requests,
      entry.windowStart,
      options.maxRequests,
      options.windowMs,
    );
  }

  /**
   * Reset rate limit for a specific identifier
   */
  public async resetRateLimit(
    identifier: string,
    config?: Partial<RateLimitOptions>,
  ): Promise<void> {
    const options = { ...this.defaultConfig, ...config };
    const key = options.keyGenerator
      ? options.keyGenerator(identifier)
      : identifier;

    delete this.store[key];
  }

  /**
   * Get rate limit configuration for API credentials
   */
  public getConfigForCredentials(credentials: ApiCredentials): RateLimitConfig {
    return {
      maxRequests: credentials.rateLimit.maxRequests,
      windowMs: credentials.rateLimit.windowMs,
      enabled: credentials.rateLimit.enabled,
    };
  }

  /**
   * Check rate limit specifically for API credentials
   */
  public async checkApiCredentialsRateLimit(
    credentials: ApiCredentials,
    operation: "authorize" | "token" | "userinfo" | "general" = "general",
  ): Promise<RateLimitResult> {
    const config = this.getConfigForCredentials(credentials);
    const identifier = `${credentials.clientId}:${operation}`;

    return this.checkRateLimit(identifier, config);
  }

  /**
   * Record API request for credentials
   */
  public async recordApiRequest(
    credentials: ApiCredentials,
    success: boolean = true,
    operation: "authorize" | "token" | "userinfo" | "general" = "general",
  ): Promise<void> {
    const config = this.getConfigForCredentials(credentials);
    const identifier = `${credentials.clientId}:${operation}`;

    await this.recordRequest(identifier, success, config);
  }

  /**
   * Global rate limiting (per IP address)
   */
  public async checkGlobalRateLimit(
    ipAddress: string,
    config?: Partial<RateLimitConfig>,
  ): Promise<RateLimitResult> {
    const globalConfig = {
      maxRequests: 1000, // Higher limit for IP-based limiting
      windowMs: 3600000, // 1 hour
      enabled: true,
      ...config,
    };

    return this.checkRateLimit(`global:${ipAddress}`, globalConfig);
  }

  /**
   * User-specific rate limiting
   */
  public async checkUserRateLimit(
    userId: string,
    config?: Partial<RateLimitConfig>,
  ): Promise<RateLimitResult> {
    const userConfig = {
      maxRequests: 500, // Per user limit
      windowMs: 3600000, // 1 hour
      enabled: true,
      ...config,
    };

    return this.checkRateLimit(`user:${userId}`, userConfig);
  }

  /**
   * Check if rate limit window has expired
   */
  private isWindowExpired(entry: RateLimitEntry, windowMs: number): boolean {
    const now = new Date();
    const windowEnd = new Date(entry.windowStart.getTime() + windowMs);
    return now > windowEnd;
  }

  /**
   * Start cleanup process for expired entries
   */
  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Clean up expired entries from memory
   */
  private cleanup(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of Object.entries(this.store)) {
      // Remove entries that haven't been used in the last hour
      const inactiveThreshold = new Date(now.getTime() - 3600000); // 1 hour

      if (entry.lastRequest < inactiveThreshold) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      delete this.store[key];
    });

    if (keysToDelete.length > 0) {
      console.log(
        `Rate limiter cleaned up ${keysToDelete.length} expired entries`,
      );
    }
  }

  /**
   * Get current store statistics
   */
  public getStats(): {
    totalEntries: number;
    activeEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Object.values(this.store);
    const now = new Date();
    const activeThreshold = new Date(now.getTime() - 3600000); // 1 hour

    const activeEntries = entries.filter(
      (entry) => entry.lastRequest >= activeThreshold,
    );
    const timestamps = entries.map((entry) => entry.lastRequest);

    return {
      totalEntries: entries.length,
      activeEntries: activeEntries.length,
      oldestEntry:
        timestamps.length > 0
          ? new Date(Math.min(...timestamps.map((t) => t.getTime())))
          : null,
      newestEntry:
        timestamps.length > 0
          ? new Date(Math.max(...timestamps.map((t) => t.getTime())))
          : null,
    };
  }

  /**
   * Clear all rate limit data
   */
  public clearAll(): void {
    this.store = {};
  }

  /**
   * Stop the rate limiter and cleanup
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearAll();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Export both the class and singleton instance
export { RateLimiter };
export default rateLimiter;

// Helper functions for middleware usage
export const createRateLimitMiddleware = (
  config?: Partial<RateLimitConfig>,
) => {
  return async (
    request: Request,
    identifier: string,
  ): Promise<RateLimitResult> => {
    return rateLimiter.checkRateLimit(identifier, config);
  };
};

export const createApiRateLimitMiddleware = () => {
  return async (
    credentials: ApiCredentials,
    operation?: "authorize" | "token" | "userinfo" | "general",
  ): Promise<RateLimitResult> => {
    return rateLimiter.checkApiCredentialsRateLimit(credentials, operation);
  };
};

// Rate limit headers helper
export const createRateLimitHeaders = (
  result: RateLimitResult,
): Record<string, string> => {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(
      result.resetTime.getTime() / 1000,
    ).toString(),
  };
};

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth, auth, db } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Basic environment check
    const environment = {
      node_env: process.env.NODE_ENV,
      app_url: process.env.APP_URL,
      app_domain: process.env.APP_DOMAIN,
      nextauth_url: process.env.NEXTAUTH_URL,
      firebase_project: process.env.FIREBASE_PROJECT_ID,
      has_jwt_secret: !!process.env.JWT_SECRET,
      has_encryption_key: !!process.env.ENCRYPTION_KEY,
      has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
    };

    // Test admin services
    const adminDb = await getAdminDb();
    const adminAuth = await getAdminAuth();

    // Firebase configuration check
    const firebase = {
      client: {
        has_api_key: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        has_auth_domain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        has_project_id: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        has_storage_bucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        has_messaging_sender_id:
          !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        has_app_id: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        auth_initialized:
          typeof window !== "undefined" ? !!auth : "server-side",
        db_initialized: typeof window !== "undefined" ? !!db : "server-side",
      },
      admin: {
        has_project_id: !!process.env.FIREBASE_PROJECT_ID,
        has_client_email: !!process.env.FIREBASE_CLIENT_EMAIL,
        has_private_key: !!process.env.FIREBASE_PRIVATE_KEY,
        admin_auth_initialized: !!adminAuth,
        admin_db_initialized: !!adminDb,
      },
    };

    // Test database connectivity
    let databaseTests = {
      admin_db_connection: false,
      admin_auth_connection: false,
      collections_accessible: false,
      error: null as string | null,
    };

    try {
      if (adminDb) {
        // Test Firestore connection
        await adminDb.collection("_health_check").limit(1).get();
        databaseTests.admin_db_connection = true;
        databaseTests.collections_accessible = true;
      }

      if (adminAuth) {
        // Test Auth connection by checking if we can access the service
        await adminAuth.listUsers(1);
        databaseTests.admin_auth_connection = true;
      }
    } catch (error) {
      databaseTests.error =
        error instanceof Error ? error.message : "Unknown database error";
    }

    // Rate limiting configuration
    const rateLimiting = {
      max_requests: process.env.RATE_LIMIT_MAX_REQUESTS || "100",
      window_ms: process.env.RATE_LIMIT_WINDOW_MS || "900000",
      enabled: process.env.SKIP_RATE_LIMIT !== "true",
    };

    // OAuth configuration
    const oauth = {
      session_expiry_minutes: process.env.SESSION_EXPIRY_MINUTES || "10",
      auth_code_expiry_minutes: process.env.AUTH_CODE_EXPIRY_MINUTES || "10",
      access_token_expiry_minutes:
        process.env.ACCESS_TOKEN_EXPIRY_MINUTES || "60",
      refresh_token_expiry_days: process.env.REFRESH_TOKEN_EXPIRY_DAYS || "30",
      tunnel_domain: process.env.TUNNEL_DOMAIN || null,
    };

    // Security configuration
    const security = {
      csp_enabled: process.env.CSP_ENABLED === "true",
      cors_origins: process.env.CORS_ORIGINS || "http://localhost:3000",
      force_https: process.env.FORCE_HTTPS === "true",
      security_logging: process.env.SECURITY_LOGGING !== "false",
    };

    // Overall health status
    const criticalIssues = [];

    if (!firebase.admin.admin_db_initialized) {
      criticalIssues.push("Firebase Admin Firestore not initialized");
    }

    if (!firebase.admin.admin_auth_initialized) {
      criticalIssues.push("Firebase Admin Auth not initialized");
    }

    if (!environment.has_jwt_secret) {
      criticalIssues.push("JWT_SECRET not configured");
    }

    if (!environment.has_encryption_key) {
      criticalIssues.push("ENCRYPTION_KEY not configured");
    }

    if (!databaseTests.admin_db_connection) {
      criticalIssues.push("Database connection failed");
    }

    const warnings = [];

    if (!oauth.tunnel_domain && environment.node_env === "development") {
      warnings.push(
        "TUNNEL_DOMAIN not set - OAuth callbacks may not work in development",
      );
    }

    if (!environment.has_nextauth_secret) {
      warnings.push("NEXTAUTH_SECRET not configured");
    }

    const overallStatus =
      criticalIssues.length === 0
        ? warnings.length === 0
          ? "healthy"
          : "healthy_with_warnings"
        : "unhealthy";

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const healthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      version: "1.0.0",
      system: {
        environment,
        firebase,
        database_tests: databaseTests,
        rate_limiting: rateLimiting,
        oauth,
        security,
      },
      issues: {
        critical: criticalIssues,
        warnings,
      },
      endpoints: {
        authorization: `${environment.app_url}/api/oauth/authorize`,
        token: `${environment.app_url}/api/oauth/token`,
        userinfo: `${environment.app_url}/api/oauth/userinfo`,
        dashboard: `${environment.app_url}/dashboard`,
      },
      next_steps:
        criticalIssues.length > 0
          ? [
              "Fix critical issues listed above",
              "Check Firebase Admin SDK configuration",
              "Verify environment variables are set correctly",
              "Refer to SETUP_GUIDE.md for detailed instructions",
            ]
          : [
              "System is ready for OAuth operations",
              "Create your first API credentials in the dashboard",
              "Test the OAuth flow with a sample application",
              "Configure production settings when ready",
            ],
    };

    // Set appropriate status code
    const statusCode = overallStatus === "unhealthy" ? 503 : 200;

    return NextResponse.json(healthCheck, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Health check endpoint encountered an error",
        suggestion: "Check server logs and verify your configuration",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(request: NextRequest) {
  try {
    const isHealthy = !!adminDb && !!adminAuth;
    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

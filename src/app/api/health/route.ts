import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  // Check for essential environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'SESSION_SECRET',
  ];

  requiredEnvVars.forEach(v => {
    if (!process.env[v]) {
      criticalIssues.push(`Environment variable ${v} is not set.`);
    }
  });

  const overallStatus =
    criticalIssues.length === 0
      ? warnings.length === 0
        ? "Healthy"
        : "Healthy with warnings"
      : "Critical issues detected";

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${Date.now() - startTime}ms`,
    checks: {
      critical_issues: criticalIssues,
      warnings: warnings,
    },
  });
}

export async function HEAD(request: NextRequest) {
  try {
    // A simple check can be performed here if needed in the future
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

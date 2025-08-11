import { NextRequest, NextResponse } from "next/server";
import { ServerSessionManager, SessionData, SessionToken } from "@/lib/session";
import { getUserData } from "@/lib/firebase";
import CryptoJS from "crypto-js";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Decrypt and verify refresh token
    let tokenData: SessionToken;
    try {
      const secretKey = process.env.SESSION_SECRET || "fallback-secret-key";
      const bytes = CryptoJS.AES.decrypt(refreshToken, secretKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      tokenData = JSON.parse(decryptedData);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Check if refresh token is expired
    if (tokenData.expiresAt < Date.now()) {
      return NextResponse.json(
        { success: false, error: "Refresh token expired" },
        { status: 401 }
      );
    }

    // Check if it's actually a refresh token
    if (tokenData.type !== "refresh") {
      return NextResponse.json(
        { success: false, error: "Invalid token type" },
        { status: 401 }
      );
    }

    // Get user data from Firebase to ensure user still exists
    const userData = await getUserData(tokenData.userId);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Create new session data
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const newSessionData: SessionData = {
      userId: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      provider: userData.provider,
      emailVerified: userData.emailVerified,
      createdAt: userData.createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastActivity: now.toISOString(),
      sessionId: tokenData.sessionId, // Keep the same session ID
    };

    // Create new session cookies
    const cookies = ServerSessionManager.setSessionCookies(newSessionData);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        sessionData: newSessionData,
        message: "Session refreshed successfully",
      },
      { status: 200 }
    );

    // Set cookies in response
    cookies.forEach((cookie) => {
      response.headers.append("Set-Cookie", cookie);
    });

    return response;
  } catch (error) {
    console.error("Session refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during session refresh",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

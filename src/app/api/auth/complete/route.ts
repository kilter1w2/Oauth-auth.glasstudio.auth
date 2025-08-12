import { NextRequest, NextResponse } from 'next/server';
import {
  getOAuthSession,
  updateOAuthSession,
  createUser,
  getUserByEmail,
  updateUser,
  logSecurityEvent,
  recordUsageStats,
  db,
} from '@/lib/firebase';
import {
  generateAuthorizationCode,
  createSecurityLogData,
  addMinutes,
  isExpired,
  createSuccessResponse,
  createErrorResponse,
  getClientIpAddress,
} from '@/lib/utils';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  const clientIp = getClientIpAddress(request);

  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      userEmail,
      userDisplayName,
      userPhotoURL,
      provider,
    } = body;

    // Validate required parameters
    if (!sessionId || !userId || !userEmail) {
      await logSecurityEvent(createSecurityLogData(
        'auth_complete',
        false,
        request,
        userId,
        undefined,
        'Missing required parameters',
        { body: { ...body, userId: '[REDACTED]' } }
      ));

      return NextResponse.json(
        createErrorResponse('Missing required parameters'),
        { status: 400 }
      );
    }

    // Get OAuth session
    const session = await getOAuthSession(sessionId);
    if (!session) {
      await logSecurityEvent(createSecurityLogData(
        'auth_complete',
        false,
        request,
        userId,
        undefined,
        'Invalid session ID',
        { sessionId }
      ));

      return NextResponse.json(
        createErrorResponse('Invalid session'),
        { status: 400 }
      );
    }

    // Check if session is expired
    if (isExpired(session.expiresAt)) {
      await logSecurityEvent(createSecurityLogData(
        'auth_complete',
        false,
        request,
        userId,
        session.credentialId,
        'Session expired',
        { sessionId, expiresAt: session.expiresAt }
      ));

      return NextResponse.json(
        createErrorResponse('Session has expired'),
        { status: 400 }
      );
    }

    // Check if session is already completed
    if (session.status !== 'pending') {
      await logSecurityEvent(createSecurityLogData(
        'auth_complete',
        false,
        request,
        userId,
        session.credentialId,
        'Session already completed',
        { sessionId, currentStatus: session.status }
      ));

      return NextResponse.json(
        createErrorResponse('Session has already been completed'),
        { status: 400 }
      );
    }

    // Create or update user record
    let user = await getUserByEmail(userEmail);

    if (user) {
      // Update existing user
      await updateUser(user.id, {
        displayName: userDisplayName || user.displayName,
        photoURL: userPhotoURL || user.photoURL,
        emailVerified: true,
        isActive: true,
        metadata: {
          ...user.metadata,
          lastSignInTime: new Date(),
          lastRefreshTime: new Date(),
        },
      });
    } else {
      // Create new user
      const newUserId = await createUser({
        email: userEmail,
        displayName: userDisplayName,
        photoURL: userPhotoURL,
        provider: provider || 'email',
        emailVerified: true,
        isActive: true,
        metadata: {
          lastSignInTime: new Date(),
          creationTime: new Date(),
          lastRefreshTime: new Date(),
        },
      });

      user = await getUserByEmail(userEmail); // Refetch to get complete user data
    }

    if (!user) {
      await logSecurityEvent(createSecurityLogData(
        'auth_complete',
        false,
        request,
        userId,
        session.credentialId,
        'Failed to create/retrieve user',
        { userEmail }
      ));

      return NextResponse.json(
        createErrorResponse('Failed to process user data'),
        { status: 500 }
      );
    }

    // Generate authorization code
    const authCode = generateAuthorizationCode();
    const authCodeExpiresAt = addMinutes(new Date(), 10); // 10 minutes

    // Store authorization code
    const authCodeData = {
      code: authCode,
      sessionId: session.sessionId,
      userId: user.id,
      credentialId: session.credentialId,
      redirectUri: session.redirectUri,
      scopes: session.scopes,
      codeChallenge: session.codeChallenge,
      codeChallengeMethod: session.codeChallengeMethod,
      expiresAt: Timestamp.fromDate(authCodeExpiresAt),
      used: false,
      createdAt: Timestamp.fromDate(new Date()),
    };

    await setDoc(doc(db, 'authorization_codes', authCode), authCodeData);

    // Update OAuth session
    await updateOAuthSession(sessionId, {
      userId: user.id,
      status: 'authorized',
      authorizedAt: new Date(),
    });

    // Build redirect URL with authorization code
    const redirectUrl = new URL(session.redirectUri);
    redirectUrl.searchParams.set('code', authCode);
    redirectUrl.searchParams.set('state', session.state);

    // Record successful authentication
    await recordUsageStats(session.credentialId, true);

    await logSecurityEvent(createSecurityLogData(
      'auth_complete',
      true,
      request,
      user.id,
      session.credentialId,
      undefined,
      {
        sessionId,
        provider,
        userEmail,
        scopes: session.scopes,
        redirectUri: session.redirectUri,
      }
    ));

    return NextResponse.json(
      createSuccessResponse({
        redirectUrl: redirectUrl.toString(),
        authCode,
        sessionId: session.sessionId,
        rotationId: session.rotationId,
        loginNumber: session.loginNumber,
      }, 'Authentication completed successfully')
    );

  } catch (error) {
    console.error('Auth completion error:', error);

    await logSecurityEvent(createSecurityLogData(
      'auth_complete',
      false,
      request,
      undefined,
      undefined,
      'Internal server error',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    ));

    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

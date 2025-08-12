import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, revokeAccessToken, logSecurityEvent } from '@/lib/firebase';
import { createErrorResponse, createSecurityLogData } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(createErrorResponse('Token is required'), { status: 400 });
    }

    const accessToken = await getAccessToken(token);
    if (!accessToken) {
      // Even if the token doesn't exist, we can treat it as a successful logout.
      return NextResponse.json({ success: true, message: 'Token not found or already invalidated.' });
    }

    await revokeAccessToken(token);

    await logSecurityEvent(createSecurityLogData(
        'oauth_logout',
        true,
        request,
        accessToken.userId,
        accessToken.credentialId,
        'Token revoked successfully'
    ));

    return NextResponse.json({ success: true, message: 'Token successfully revoked.' });

  } catch (error) {
    console.error('Logout error:', error);
    await logSecurityEvent(createSecurityLogData(
        'oauth_logout',
        false,
        request,
        undefined,
        undefined,
        'Internal server error'
    ));
    return NextResponse.json(createErrorResponse('Internal server error'), { status: 500 });
  }
}

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

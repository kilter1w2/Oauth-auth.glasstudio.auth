import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, logSecurityEvent } from '@/lib/firebase';
import { createOAuthError, createSecurityLogData, isExpired, createErrorResponse, getClientIpAddress } from '@/lib/utils';
import { AccessToken } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const clientIp = getClientIpAddress(request);

  if (!token) {
    return NextResponse.json(createErrorResponse('Token is required'), { status: 400 });
  }

  try {
    const accessToken = await getAccessToken(token);

    if (!accessToken || accessToken.isRevoked || isExpired(accessToken.expiresAt)) {
        await logSecurityEvent(createSecurityLogData(
            'oauth_validate',
            false,
            request,
            accessToken?.userId,
            accessToken?.credentialId,
            'Invalid or expired token'
        ));
      return NextResponse.json({ active: false }, { status: 401 });
    }

    await logSecurityEvent(createSecurityLogData(
        'oauth_validate',
        true,
        request,
        accessToken.userId,
        accessToken.credentialId,
        'Token validated successfully'
    ));

    const expiresIn = Math.floor((accessToken.expiresAt.getTime() - Date.now()) / 1000);

    return NextResponse.json({
      active: true,
      scope: accessToken.scopes.join(' '),
      client_id: accessToken.credentialId,
      user_id: accessToken.userId,
      expires_in: expiresIn,
    });

  } catch (error) {
    console.error('Token validation error:', error);
    await logSecurityEvent(createSecurityLogData(
        'oauth_validate',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

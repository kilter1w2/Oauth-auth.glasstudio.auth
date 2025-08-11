import { NextRequest, NextResponse } from 'next/server';
import {
  adminDb,
  getUser,
  logSecurityEvent,
  recordUsageStats,
} from '@/lib/firebase';
import rateLimiter from '@/lib/rateLimiter';
import {
  generateApiKey,
  generateClientId,
  generateClientSecret,
  createSuccessResponse,
  createErrorResponse,
  createSecurityLogData,
  getClientIpAddress,
  validateEmail,
} from '@/lib/utils';
import { doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc, Timestamp } from 'firebase/firestore';

interface UserAccessKey {
  id: string;
  userId: string;
  keyName: string;
  accessKey: string;
  keySecret: string;
  permissions: string[];
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  description?: string;
  usageCount: number;
}

// GET /api/user/access-key - Get user's access keys
export async function GET(request: NextRequest) {
  const clientIp = getClientIpAddress(request);
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('userEmail');

  try {
    let user;

    // Get user by ID or email
    if (userId) {
      user = await getUser(userId);
    } else if (userEmail) {
      if (!validateEmail(userEmail)) {
        return NextResponse.json(
          createErrorResponse('Invalid email format'),
          { status: 400 }
        );
      }

      // Query user by email
      const usersQuery = query(
        collection(adminDb!, 'users'),
        where('email', '==', userEmail)
      );
      const userSnapshot = await getDocs(usersQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        user = { id: userDoc.id, ...userDoc.data() };
      }
    } else {
      return NextResponse.json(
        createErrorResponse('userId or userEmail parameter is required'),
        { status: 400 }
      );
    }

    if (!user) {
      await logSecurityEvent(createSecurityLogData(
        'access_key_list',
        false,
        request,
        userId || undefined,
        undefined,
        'User not found',
        { userId, userEmail }
      ));

      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      );
    }

    // Check rate limiting
    const rateLimitResult = await rateLimiter.checkUserRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createErrorResponse('Rate limit exceeded. Please try again later.'),
        { status: 429 }
      );
    }

    // Get user's access keys
    const accessKeysQuery = query(
      collection(adminDb!, 'user_access_keys'),
      where('userId', '==', user.id)
    );
    const accessKeysSnapshot = await getDocs(accessKeysQuery);

    const accessKeys = accessKeysSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        lastUsed: data.lastUsed?.toDate?.() || null,
        expiresAt: data.expiresAt?.toDate?.() || null,
        // Don't return the actual secret in the list
        keySecret: undefined,
      };
    });

    await logSecurityEvent(createSecurityLogData(
      'access_key_list',
      true,
      request,
      user.id,
      undefined,
      undefined,
      { accessKeysCount: accessKeys.length }
    ));

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        accessKeys,
      }, 'Access keys retrieved successfully')
    );

  } catch (error) {
    console.error('Get access keys error:', error);

    await logSecurityEvent(createSecurityLogData(
      'access_key_list',
      false,
      request,
      userId || undefined,
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

// POST /api/user/access-key - Create new access key
export async function POST(request: NextRequest) {
  const clientIp = getClientIpAddress(request);

  try {
    const body = await request.json();
    const {
      userId,
      userEmail,
      keyName,
      description,
      permissions = ['read'],
      expiryDays,
    } = body;

    // Validate required fields
    if (!keyName || (!userId && !userEmail)) {
      return NextResponse.json(
        createErrorResponse('Missing required fields: keyName and (userId or userEmail)'),
        { status: 400 }
      );
    }

    let user;

    // Get user by ID or email
    if (userId) {
      user = await getUser(userId);
    } else if (userEmail) {
      if (!validateEmail(userEmail)) {
        return NextResponse.json(
          createErrorResponse('Invalid email format'),
          { status: 400 }
        );
      }

      // Query user by email
      const usersQuery = query(
        collection(adminDb!, 'users'),
        where('email', '==', userEmail)
      );
      const userSnapshot = await getDocs(usersQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        user = { id: userDoc.id, ...userDoc.data() };
      }
    }

    if (!user) {
      await logSecurityEvent(createSecurityLogData(
        'access_key_create',
        false,
        request,
        userId || undefined,
        undefined,
        'User not found',
        { userId, userEmail }
      ));

      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      );
    }

    // Check rate limiting for creating access keys
    const rateLimitResult = await rateLimiter.checkUserRateLimit(user.id, {
      maxRequests: 10,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createErrorResponse('Rate limit exceeded. Please try again later.'),
        { status: 429 }
      );
    }

    // Validate permissions
    const validPermissions = ['read', 'write', 'admin'];
    const sanitizedPermissions = permissions.filter((perm: string) =>
      validPermissions.includes(perm)
    );

    if (sanitizedPermissions.length === 0) {
      return NextResponse.json(
        createErrorResponse('At least one valid permission is required'),
        { status: 400 }
      );
    }

    // Validate key name
    if (keyName.length < 1 || keyName.length > 100) {
      return NextResponse.json(
        createErrorResponse('Key name must be between 1 and 100 characters'),
        { status: 400 }
      );
    }

    // Check if key name already exists for this user
    const existingKeyQuery = query(
      collection(adminDb!, 'user_access_keys'),
      where('userId', '==', user.id),
      where('keyName', '==', keyName)
    );
    const existingKeySnapshot = await getDocs(existingKeyQuery);

    if (!existingKeySnapshot.empty) {
      return NextResponse.json(
        createErrorResponse('Access key with this name already exists'),
        { status: 409 }
      );
    }

    // Generate access key and secret
    const accessKey = `gla_user_${generateApiKey().replace('gla_api_', '')}`;
    const keySecret = generateClientSecret();
    const keyId = generateClientId().replace('gla_', '');

    // Calculate expiry date
    let expiresAt;
    if (expiryDays && expiryDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
    }

    // Create access key data
    const accessKeyData: Omit<UserAccessKey, 'id'> = {
      userId: user.id,
      keyName: keyName.trim(),
      accessKey,
      keySecret,
      permissions: sanitizedPermissions,
      isActive: true,
      createdAt: new Date(),
      expiresAt,
      description: description?.trim() || undefined,
      usageCount: 0,
    };

    // Store in Firestore
    await setDoc(doc(adminDb!, 'user_access_keys', keyId), {
      ...accessKeyData,
      createdAt: Timestamp.fromDate(accessKeyData.createdAt),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    });

    // Create response (include secret only once during creation)
    const newAccessKey = {
      id: keyId,
      ...accessKeyData,
    };

    await logSecurityEvent(createSecurityLogData(
      'access_key_create',
      true,
      request,
      user.id,
      undefined,
      undefined,
      {
        keyName,
        accessKey,
        permissions: sanitizedPermissions,
        expiryDays: expiryDays || null,
      }
    ));

    return NextResponse.json(
      createSuccessResponse(newAccessKey, 'Access key created successfully'),
      { status: 201 }
    );

  } catch (error) {
    console.error('Create access key error:', error);

    await logSecurityEvent(createSecurityLogData(
      'access_key_create',
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

// DELETE /api/user/access-key - Delete/revoke access key
export async function DELETE(request: NextRequest) {
  const clientIp = getClientIpAddress(request);
  const searchParams = request.nextUrl.searchParams;
  const keyId = searchParams.get('keyId');
  const accessKey = searchParams.get('accessKey');
  const userId = searchParams.get('userId');

  try {
    if (!keyId && !accessKey) {
      return NextResponse.json(
        createErrorResponse('keyId or accessKey parameter is required'),
        { status: 400 }
      );
    }

    let keyDoc;

    if (keyId) {
      keyDoc = await getDoc(doc(adminDb!, 'user_access_keys', keyId));
    } else if (accessKey) {
      // Find by access key
      const keyQuery = query(
        collection(adminDb!, 'user_access_keys'),
        where('accessKey', '==', accessKey)
      );
      const keySnapshot = await getDocs(keyQuery);

      if (!keySnapshot.empty) {
        keyDoc = keySnapshot.docs[0];
      }
    }

    if (!keyDoc || !keyDoc.exists()) {
      return NextResponse.json(
        createErrorResponse('Access key not found'),
        { status: 404 }
      );
    }

    const keyData = keyDoc.data();

    // Verify ownership if userId is provided
    if (userId && keyData.userId !== userId) {
      await logSecurityEvent(createSecurityLogData(
        'access_key_delete',
        false,
        request,
        userId,
        undefined,
        'Unauthorized access key deletion attempt',
        { keyId: keyDoc.id, providedUserId: userId, actualUserId: keyData.userId }
      ));

      return NextResponse.json(
        createErrorResponse('Unauthorized: You can only delete your own access keys'),
        { status: 403 }
      );
    }

    // Delete the access key
    await deleteDoc(keyDoc.ref);

    await logSecurityEvent(createSecurityLogData(
      'access_key_delete',
      true,
      request,
      keyData.userId,
      undefined,
      undefined,
      {
        keyId: keyDoc.id,
        keyName: keyData.keyName,
        accessKey: keyData.accessKey,
      }
    ));

    return NextResponse.json(
      createSuccessResponse(
        { keyId: keyDoc.id, keyName: keyData.keyName },
        'Access key deleted successfully'
      )
    );

  } catch (error) {
    console.error('Delete access key error:', error);

    await logSecurityEvent(createSecurityLogData(
      'access_key_delete',
      false,
      request,
      userId || undefined,
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import {
  User,
  ApiCredentials,
  OAuthSession,
  UsageStats,
  AuthorizationCode,
  AccessToken,
  RefreshToken,
  SecurityLog,
} from "@/types";

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase Admin Configuration (Server-side only)
const getAdminConfig = () => {
  if (typeof window !== "undefined") return null;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn(
      "Firebase Admin SDK credentials not found. Server-side features will be limited.",
    );
    return null;
  }

  return {
    projectId,
    privateKey,
    clientEmail,
  };
};

// Initialize Firebase Client
let app: FirebaseApp | undefined;
if (typeof window !== "undefined" && !getApps().length) {
  app = initializeApp(firebaseConfig);
} else if (typeof window !== "undefined") {
  app = getApps()[0];
}

// Initialize Firebase Admin (Server-side only) - using dynamic imports
let adminApp: any = null;
let adminAppPromise: Promise<any> | null = null;

const getAdminApp = async () => {
  if (typeof window !== "undefined") return null;

  if (adminApp) return adminApp;

  if (!adminAppPromise) {
    adminAppPromise = (async () => {
      try {
        const {
          initializeApp: initializeAdminApp,
          getApps: getAdminApps,
          cert,
        } = await import("firebase-admin/app");
        const adminConfig = getAdminConfig();

        if (!adminConfig) return null;

        if (!getAdminApps().length) {
          adminApp = initializeAdminApp({
            credential: cert(adminConfig),
          });
          console.log("Firebase Admin SDK initialized successfully");
        } else {
          adminApp = getAdminApps()[0];
        }

        return adminApp;
      } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error);
        return null;
      }
    })();
  }

  return adminAppPromise;
};

// Client-side Firebase services
export const auth: Auth | null =
  typeof window !== "undefined" && app ? getAuth(app) : null;
export const db: Firestore | null =
  typeof window !== "undefined" && app ? getFirestore(app) : null;
export const googleProvider: GoogleAuthProvider | null =
  typeof window !== "undefined" ? new GoogleAuthProvider() : null;

// Server-side Firebase services (using dynamic imports)
export const getAdminAuth = async () => {
  if (typeof window !== "undefined") return null;

  try {
    const app = await getAdminApp();
    if (!app) return null;

    const { getAuth } = await import("firebase-admin/auth");
    return getAuth(app);
  } catch (error) {
    console.error("Failed to get Admin Auth:", error);
    return null;
  }
};

export const getAdminDb = async () => {
  if (typeof window !== "undefined") return null;

  try {
    const app = await getAdminApp();
    if (!app) return null;

    const { getFirestore } = await import("firebase-admin/firestore");
    return getFirestore(app);
  } catch (error) {
    console.error("Failed to get Admin Firestore:", error);
    return null;
  }
};

// Legacy exports for compatibility (will be null on client-side)
export const adminAuth: any = null;
export const adminDb: any = null;

// Collection References
export const COLLECTIONS = {
  USERS: "users",
  API_CREDENTIALS: "api_credentials",
  OAUTH_SESSIONS: "oauth_sessions",
  AUTHORIZATION_CODES: "authorization_codes",
  ACCESS_TOKENS: "access_tokens",
  REFRESH_TOKENS: "refresh_tokens",
  USAGE_STATS: "usage_stats",
  SECURITY_LOGS: "security_logs",
} as const;

// Utility Functions
export const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

export const convertToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Authentication Functions
export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  if (!auth || !googleProvider) return null;

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  if (!auth) return;

  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void,
) => {
  if (!auth) return () => {};

  return onAuthStateChanged(auth, callback);
};

// User Management
export const createUser = async (
  userData: Omit<User, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) {
    throw new Error(
      "Database not initialized. Please check your Firebase configuration.",
    );
  }

  const now = new Date();
  const userDoc = {
    ...userData,
    createdAt: convertToTimestamp(now),
    updatedAt: convertToTimestamp(now),
  };

  const docRef = await addDoc(collection(database, COLLECTIONS.USERS), userDoc);
  return docRef.id;
};

export const getUser = async (userId: string): Promise<User | null> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) {
    console.warn("Database not initialized, returning null");
    return null;
  }

  const userDoc = await getDoc(doc(database, COLLECTIONS.USERS, userId));
  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  return {
    id: userDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as User;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) {
    console.warn("Database not initialized, returning null");
    return null;
  }

  const q = query(
    collection(database, COLLECTIONS.USERS),
    where("email", "==", email),
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const userDoc = querySnapshot.docs[0];
  const data = userDoc.data();

  return {
    id: userDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as User;
};

export const updateUser = async (
  userId: string,
  updates: Partial<User>,
): Promise<void> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const updateData = {
    ...updates,
    updatedAt: convertToTimestamp(new Date()),
  };

  await updateDoc(doc(database, COLLECTIONS.USERS, userId), updateData);
};

// API Credentials Management
export const createApiCredentials = async (
  credentialsData: Omit<ApiCredentials, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const now = new Date();
  const credentialsDoc = {
    ...credentialsData,
    createdAt: convertToTimestamp(now),
    updatedAt: convertToTimestamp(now),
  };

  const docRef = await addDoc(
    collection(database, COLLECTIONS.API_CREDENTIALS),
    credentialsDoc,
  );
  return docRef.id;
};

export const getApiCredentials = async (
  credentialId: string,
): Promise<ApiCredentials | null> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const credentialDoc = await getDoc(
    doc(database, COLLECTIONS.API_CREDENTIALS, credentialId),
  );
  if (!credentialDoc.exists()) return null;

  const data = credentialDoc.data();
  return {
    id: credentialDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    lastUsed: data.lastUsed ? convertTimestamp(data.lastUsed) : undefined,
  } as ApiCredentials;
};

export const getApiCredentialsByClientId = async (
  clientId: string,
): Promise<ApiCredentials | null> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const q = query(
    collection(database, COLLECTIONS.API_CREDENTIALS),
    where("clientId", "==", clientId),
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const credentialDoc = querySnapshot.docs[0];
  const data = credentialDoc.data();

  return {
    id: credentialDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    lastUsed: data.lastUsed ? convertTimestamp(data.lastUsed) : undefined,
  } as ApiCredentials;
};

export const getUserApiCredentials = async (
  userId: string,
): Promise<ApiCredentials[]> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const q = query(
    collection(database, COLLECTIONS.API_CREDENTIALS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      lastUsed: data.lastUsed ? convertTimestamp(data.lastUsed) : undefined,
    } as ApiCredentials;
  });
};

export const updateApiCredentials = async (
  credentialId: string,
  updates: Partial<ApiCredentials>,
): Promise<void> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const updateData = {
    ...updates,
    updatedAt: convertToTimestamp(new Date()),
  };

  await updateDoc(
    doc(database, COLLECTIONS.API_CREDENTIALS, credentialId),
    updateData,
  );
};

export const deleteApiCredentials = async (
  credentialId: string,
): Promise<void> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  await deleteDoc(doc(database, COLLECTIONS.API_CREDENTIALS, credentialId));
};

// OAuth Session Management
export const createOAuthSession = async (
  sessionData: Omit<
    OAuthSession,
    "createdAt" | "expiresAt" | "authorizedAt" | "tokenExpiresAt"
  > & { expiresAt: Date },
): Promise<string> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const now = new Date();
  const sessionDoc = {
    ...sessionData,
    createdAt: convertToTimestamp(now),
    expiresAt: convertToTimestamp(sessionData.expiresAt),
  };

  const docRef = await addDoc(
    collection(database, COLLECTIONS.OAUTH_SESSIONS),
    sessionDoc,
  );
  return docRef.id;
};

export const getOAuthSession = async (
  sessionId: string,
): Promise<OAuthSession | null> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const sessionDoc = await getDoc(
    doc(database, COLLECTIONS.OAUTH_SESSIONS, sessionId),
  );
  if (!sessionDoc.exists()) return null;

  const data = sessionDoc.data();
  return {
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    expiresAt: convertTimestamp(data.expiresAt),
    authorizedAt: data.authorizedAt
      ? convertTimestamp(data.authorizedAt)
      : undefined,
    tokenExpiresAt: data.tokenExpiresAt
      ? convertTimestamp(data.tokenExpiresAt)
      : undefined,
  } as OAuthSession;
};

export const updateOAuthSession = async (
  sessionId: string,
  updates: Partial<OAuthSession>,
): Promise<void> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const updateData: any = { ...updates };

  if (updates.expiresAt) {
    updateData.expiresAt = convertToTimestamp(updates.expiresAt);
  }
  if (updates.authorizedAt) {
    updateData.authorizedAt = convertToTimestamp(updates.authorizedAt);
  }
  if (updates.tokenExpiresAt) {
    updateData.tokenExpiresAt = convertToTimestamp(updates.tokenExpiresAt);
  }

  await updateDoc(
    doc(database, COLLECTIONS.OAUTH_SESSIONS, sessionId),
    updateData,
  );
};

// Usage Statistics
export const recordUsageStats = async (
  credentialId: string,
  success: boolean,
): Promise<void> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const today = new Date().toISOString().split("T")[0];
  const statsId = `${credentialId}_${today}`;

  const statsRef = doc(database, COLLECTIONS.USAGE_STATS, statsId);
  const statsDoc = await getDoc(statsRef);

  if (statsDoc.exists()) {
    const currentData = statsDoc.data();
    await updateDoc(statsRef, {
      requests: currentData.requests + 1,
      errors: success ? currentData.errors : currentData.errors + 1,
      successfulAuths: success
        ? currentData.successfulAuths + 1
        : currentData.successfulAuths,
      failedAuths: success
        ? currentData.failedAuths
        : currentData.failedAuths + 1,
      lastRequest: convertToTimestamp(new Date()),
    });
  } else {
    await setDoc(statsRef, {
      credentialId,
      date: today,
      requests: 1,
      errors: success ? 0 : 1,
      successfulAuths: success ? 1 : 0,
      failedAuths: success ? 0 : 1,
      lastRequest: convertToTimestamp(new Date()),
    });
  }
};

// Security Logging
export const logSecurityEvent = async (
  logData: Omit<SecurityLog, "id" | "timestamp">,
): Promise<void> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const logDoc = {
    ...logData,
    timestamp: convertToTimestamp(new Date()),
  };

  await addDoc(collection(database, COLLECTIONS.SECURITY_LOGS), logDoc);
};

// Cleanup expired sessions and tokens
export const cleanupExpiredSessions = async (): Promise<void> => {
  const database = typeof window === "undefined" ? await getAdminDb() : db;
  if (!database) throw new Error("Database not initialized");

  const now = new Date();
  const expiredSessionsQuery = query(
    collection(database, COLLECTIONS.OAUTH_SESSIONS),
    where("expiresAt", "<", convertToTimestamp(now)),
  );

  const expiredSessions = await getDocs(expiredSessionsQuery);
  const deletePromises = expiredSessions.docs.map((doc) => deleteDoc(doc.ref));

  await Promise.all(deletePromises);
};

export default {
  auth,
  db,
  getAdminAuth,
  getAdminDb,
  googleProvider,
  signInWithGoogle,
  signOutUser,
  onAuthStateChange,
  createUser,
  getUser,
  getUserByEmail,
  updateUser,
  createApiCredentials,
  getApiCredentials,
  getApiCredentialsByClientId,
  getUserApiCredentials,
  updateApiCredentials,
  deleteApiCredentials,
  createOAuthSession,
  getOAuthSession,
  updateOAuthSession,
  recordUsageStats,
  logSecurityEvent,
  cleanupExpiredSessions,
};

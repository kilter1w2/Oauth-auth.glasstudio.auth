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
  SecurityLog,
  AccessToken,
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

// Initialize Firebase Client
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Client-side Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();

// Collection References
export const COLLECTIONS = {
  USERS: "users",
  API_CREDENTIALS: "api_credentials",
  OAUTH_SESSIONS: "oauth_sessions",
  USAGE_STATS: "usage_stats",
  SECURITY_LOGS: "security_logs",
  ACCESS_TOKENS: "access_tokens",
} as const;

// Utility Functions
export const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

export const convertToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Authentication Functions
export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return null;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void,
) => {
  return onAuthStateChanged(auth, callback);
};

// User Management
export const createUser = async (
  userData: Omit<User, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const newUser = {
    ...userData,
    createdAt: convertToTimestamp(new Date()),
    updatedAt: convertToTimestamp(new Date()),
  };

  const userRef = await addDoc(collection(db, COLLECTIONS.USERS), newUser);
  return userRef.id;
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  return {
    ...data,
    id: userDoc.id,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as User;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where("email", "==", email),
    limit(1),
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  const userDoc = querySnapshot.docs[0];
  const data = userDoc.data();

  return {
    ...data,
    id: userDoc.id,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as User;
};

export const updateUser = async (
  userId: string,
  updates: Partial<User>,
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: convertToTimestamp(new Date()),
  });
};

// API Credentials Management
export const createApiCredentials = async (
  credentialsData: Omit<ApiCredentials, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const newCredentials = {
    ...credentialsData,
    createdAt: convertToTimestamp(new Date()),
    updatedAt: convertToTimestamp(new Date()),
  };

  const credRef = await addDoc(
    collection(db, COLLECTIONS.API_CREDENTIALS),
    newCredentials,
  );
  return credRef.id;
};

export const getApiCredentials = async (
  credentialId: string,
): Promise<ApiCredentials | null> => {
  const credDoc = await getDoc(
    doc(db, COLLECTIONS.API_CREDENTIALS, credentialId),
  );
  if (!credDoc.exists()) return null;

  const data = credDoc.data();
  return {
    ...data,
    id: credDoc.id,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as ApiCredentials;
};

export const getApiCredentialsByClientId = async (
  clientId: string,
): Promise<ApiCredentials | null> => {
  const q = query(
    collection(db, COLLECTIONS.API_CREDENTIALS),
    where("clientId", "==", clientId),
    limit(1),
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  const credDoc = querySnapshot.docs[0];
  const data = credDoc.data();

  return {
    ...data,
    id: credDoc.id,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as ApiCredentials;
};

export const getUserApiCredentials = async (
  userId: string,
): Promise<ApiCredentials[]> => {
  const q = query(
    collection(db, COLLECTIONS.API_CREDENTIALS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as ApiCredentials;
  });
};

export const updateApiCredentials = async (
  credentialId: string,
  updates: Partial<ApiCredentials>,
): Promise<void> => {
  const credRef = doc(db, COLLECTIONS.API_CREDENTIALS, credentialId);
  await updateDoc(credRef, {
    ...updates,
    updatedAt: convertToTimestamp(new Date()),
  });
};

export const deleteApiCredentials = async (
  credentialId: string,
): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.API_CREDENTIALS, credentialId));
};

export const getAccessToken = async (
  token: string,
): Promise<AccessToken | null> => {
  const tokenDoc = await getDoc(doc(db, COLLECTIONS.ACCESS_TOKENS, token));
  if (!tokenDoc.exists()) return null;

  const data = tokenDoc.data();
  // The document ID is the token itself.
  return {
    token: tokenDoc.id,
    userId: data.userId,
    credentialId: data.credentialId,
    sessionId: data.sessionId,
    scopes: data.scopes,
    tokenType: data.tokenType,
    isRevoked: data.isRevoked,
    createdAt: convertTimestamp(data.createdAt),
    expiresAt: convertTimestamp(data.expiresAt),
  } as AccessToken;
};

export const revokeAccessToken = async (token: string): Promise<void> => {
  const tokenRef = doc(db, COLLECTIONS.ACCESS_TOKENS, token);
  // Check if the document exists before updating to avoid creating new documents.
  const tokenSnap = await getDoc(tokenRef);
  if (tokenSnap.exists()) {
    await updateDoc(tokenRef, {
      isRevoked: true,
    });
  }
};

// OAuth Session Management
export const createOAuthSession = async (
  sessionData: Omit<
    OAuthSession,
    "createdAt" | "expiresAt" | "authorizedAt" | "tokenExpiresAt"
  > & { expiresAt: Date },
): Promise<string> => {
  const newSession = {
    ...sessionData,
    createdAt: convertToTimestamp(new Date()),
    expiresAt: convertToTimestamp(sessionData.expiresAt),
  };

  const sessionRef = await addDoc(
    collection(db, COLLECTIONS.OAUTH_SESSIONS),
    newSession,
  );
  return sessionRef.id;
};

export const getOAuthSession = async (
  sessionId: string,
): Promise<OAuthSession | null> => {
  const sessionDoc = await getDoc(
    doc(db, COLLECTIONS.OAUTH_SESSIONS, sessionId),
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
    doc(db, COLLECTIONS.OAUTH_SESSIONS, sessionId),
    updateData,
  );
};

// Usage Statistics
export const recordUsageStats = async (
  credentialId: string,
  success: boolean,
): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const statsId = `${credentialId}_${today}`;

  const statsRef = doc(db, COLLECTIONS.USAGE_STATS, statsId);
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
  const logDoc = {
    ...logData,
    timestamp: convertToTimestamp(new Date()),
  };

  await addDoc(collection(db, COLLECTIONS.SECURITY_LOGS), logDoc);
};

// Cleanup expired sessions and tokens
export const cleanupExpiredSessions = async (): Promise<void> => {
  const now = new Date();
  const expiredSessionsQuery = query(
    collection(db, COLLECTIONS.OAUTH_SESSIONS),
    where("expiresAt", "<", convertToTimestamp(now)),
  );

  const expiredSessions = await getDocs(expiredSessionsQuery);
  const deletePromises = expiredSessions.docs.map((doc) => deleteDoc(doc.ref));

  await Promise.all(deletePromises);
};

export default {
  auth,
  db,
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
  getAccessToken,
  revokeAccessToken,
  createOAuthSession,
  getOAuthSession,
  updateOAuthSession,
  recordUsageStats,
  logSecurityEvent,
  cleanupExpiredSessions,
};

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase Client App
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Collection References
export const COLLECTIONS = {
  USERS: "users",
  API_CREDENTIALS: "api_credentials",
} as const;

// Authentication Functions
export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<FirebaseUser | null> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string,
): Promise<FirebaseUser | null> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }

    return result.user;
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
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
  return onAuthStateChanged(auth, callback);
};

// User Profile Functions
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const updateUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  try {
    await updateProfile(user, updates);
  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
};

// User Data Functions
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return {
      id: userDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const saveUserData = async (user: FirebaseUser) => {
  try {
    const userData = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: user.providerData[0]?.providerId || "email",
      emailVerified: user.emailVerified,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    };

    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData, {
      merge: true,
    });
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

export const updateUserData = async (userId: string, updates: any) => {
  try {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, COLLECTIONS.USERS, userId), updateData);
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

// API Credentials Functions
export const getUserApiCredentials = async (userId: string) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.API_CREDENTIALS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastUsed: data.lastUsed?.toDate() || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching API credentials:", error);
    return [];
  }
};

// Error handling helpers
export const getFirebaseErrorMessage = (error: any): string => {
  if (!error?.code) return "An unknown error occurred";

  switch (error.code) {
    case "auth/user-not-found":
      return "No user found with this email address";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/invalid-email":
      return "Please enter a valid email address";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by the browser";
    case "auth/configuration-not-found":
      return "Firebase configuration not found. Please check your environment variables.";
    default:
      return error.message || "An error occurred";
  }
};

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string,
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Export app instance
export { app };

// Default export
export default {
  auth,
  db,
  googleProvider,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signOutUser,
  onAuthStateChange,
  getCurrentUser,
  updateUserProfile,
  getUserData,
  saveUserData,
  updateUserData,
  getUserApiCredentials,
  getFirebaseErrorMessage,
  validateEmail,
  validatePassword,
  COLLECTIONS,
};

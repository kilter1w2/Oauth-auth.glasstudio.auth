"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { onAuthStateChange, signOutUser } from "@/lib/firebase-client";
import { SessionManager, useSession } from "@/lib/session";
import { User as FirebaseUser } from "firebase/auth";

interface SavedAccount {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  lastUsed: Date;
}

function AccountSelectContent() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState<string>("Application");
  const [sessionId, setSessionId] = useState<string>("");

  const searchParams = useSearchParams();
  const router = useRouter();

  // Session management
  const {
    getSession,
    clearSession,
    isAuthenticated,
    getCurrentUser,
    updateActivity,
  } = useSession();

  useEffect(() => {
    // Get session and client info from URL params
    const session = searchParams.get("session");
    const client = searchParams.get("client_name");

    if (session) setSessionId(session);
    if (client) setClientName(decodeURIComponent(client));

    // Check session first
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser as FirebaseUser);
      loadSavedAccounts();
      setLoading(false);
      updateActivity();
      return;
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        // Create session if user is authenticated via Firebase
        const sessionManager = SessionManager.getInstance();
        sessionManager.createSession(user);
        loadSavedAccounts();
        updateActivity();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [searchParams]);

  const loadSavedAccounts = () => {
    // In a real implementation, you'd load saved accounts from localStorage or API
    // For now, we'll create mock data based on current user
    if (currentUser) {
      const accounts: SavedAccount[] = [
        {
          id: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || undefined,
          photoURL: currentUser.photoURL || undefined,
          lastUsed: new Date(),
        },
      ];

      // Add some mock additional accounts for demo
      const additionalAccounts = [
        {
          id: "demo1",
          email: "taikhoangphu2.minhtriet@gmail.com",
          displayName: "taikhoangphu2 minhtriet",
          photoURL:
            "https://ui-avatars.com/api/?name=taikhoangphu2+minhtriet&background=4285F4&color=fff",
          lastUsed: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          id: "demo2",
          email: "student-02-55a3f4836049@qwiklabs.net",
          displayName: "student e43ea24e",
          photoURL:
            "https://ui-avatars.com/api/?name=student+e43ea24e&background=34A853&color=fff",
          lastUsed: new Date(Date.now() - 172800000), // 2 days ago
        },
      ];

      setSavedAccounts([...accounts, ...additionalAccounts]);
    }
  };

  const handleAccountSelect = async (account: SavedAccount) => {
    if (!sessionId) {
      alert("Invalid session. Please try again.");
      return;
    }

    try {
      // Update session activity
      updateActivity();

      // If selecting current user, proceed with OAuth flow
      if (account.id === currentUser?.uid) {
        router.push(
          `/auth/authorize?session=${sessionId}&account=${account.id}`,
        );
      } else {
        // For other accounts, clear current session and redirect to login
        clearSession();
        router.push(
          `/auth/login?session=${sessionId}&email_hint=${encodeURIComponent(account.email)}&client_name=${encodeURIComponent(clientName)}`,
        );
      }
    } catch (error) {
      console.error("Failed to select account:", error);
      alert("Failed to select account. Please try again.");
    }
  };

  const handleUseAnotherAccount = () => {
    // Clear current session when switching to another account
    clearSession();

    if (sessionId) {
      router.push(
        `/auth/login?session=${sessionId}&client_name=${encodeURIComponent(clientName)}&new_account=true`,
      );
    } else {
      router.push(
        `/auth/login?client_name=${encodeURIComponent(clientName)}&new_account=true`,
      );
    }
  };

  const getAccountInitials = (account: SavedAccount) => {
    if (account.displayName) {
      return account.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return account.email.split("@")[0].slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-200">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200">
                GLAStudio
              </span>
            </div>
          </div>
          <h2 className="text-2xl font-normal text-gray-900">
            Choose an account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            to continue to{" "}
            <span className="font-medium text-blue-600">{clientName}</span>
          </p>
        </div>

        {/* Account Selection Card */}
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          {/* Account List */}
          <div className="divide-y divide-gray-200">
            {savedAccounts.map((account, index) => (
              <button
                key={account.id}
                onClick={() => handleAccountSelect(account)}
                className="w-full px-6 py-4 text-left hover:bg-blue-50 hover:scale-105 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200 cursor-pointer transform group"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {account.photoURL ? (
                      <img
                        className="h-10 w-10 rounded-full group-hover:scale-110 transition-transform duration-200"
                        src={account.photoURL}
                        alt={account.displayName || account.email}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 group-hover:scale-110 transition-all duration-200">
                        <span className="text-sm font-medium text-white">
                          {getAccountInitials(account)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {account.displayName && (
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-200">
                        {account.displayName}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 truncate group-hover:text-blue-600 transition-colors duration-200">
                      {account.email}
                    </p>
                  </div>
                  {account.id === currentUser?.uid && (
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 group-hover:scale-105 transition-all duration-200">
                        Current
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Use Another Account */}
          <div className="border-t border-gray-200">
            <button
              onClick={handleUseAnotherAccount}
              className="w-full px-6 py-4 text-left hover:bg-blue-50 hover:scale-105 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200 cursor-pointer transform group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 group-hover:scale-110 transition-all duration-200">
                    <svg
                      className="h-5 w-5 text-gray-400 group-hover:text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-200">
                    Use another account
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <button className="hover:text-blue-600 hover:scale-105 cursor-pointer transition-all duration-200 transform">
              Privacy Policy
            </button>
            <span>•</span>
            <button className="hover:text-blue-600 hover:scale-105 cursor-pointer transition-all duration-200 transform">
              Terms of Service
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Before using GLAStudio OAuth, you can review our{" "}
            <button className="text-blue-600 hover:text-blue-800 hover:scale-105 cursor-pointer transition-all duration-200 transform">
              privacy policy
            </button>{" "}
            and{" "}
            <button className="text-blue-600 hover:text-blue-800 hover:scale-105 cursor-pointer transition-all duration-200 transform">
              terms of service
            </button>
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center justify-between text-sm">
          <div className="relative">
            <select className="bg-transparent border-none text-gray-500 focus:outline-none cursor-pointer hover:text-blue-600 transition-colors duration-200">
              <option>English</option>
              <option>Tiếng Việt</option>
              <option>Español</option>
              <option>Français</option>
            </select>
          </div>
          <div className="flex space-x-4 text-gray-500">
            <button className="hover:text-blue-600 hover:scale-105 cursor-pointer transition-all duration-200 transform">
              Help
            </button>
            <button className="hover:text-blue-600 hover:scale-105 cursor-pointer transition-all duration-200 transform">
              Privacy
            </button>
            <button className="hover:text-blue-600 hover:scale-105 cursor-pointer transition-all duration-200 transform">
              Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountSelectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AccountSelectContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  onAuthStateChange, 
  signOutUser, 
  getUserApiCredentials, 
  createApiCredentials 
} from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { ApiCredentials } from "@/types";
import { useSession } from "@/lib/session";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export default function DashboardPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<ApiCredentials[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Session management
  const {
    getSession,
    clearSession,
    isAuthenticated,
    getCurrentUser,
    updateActivity,
  } = useSession();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    redirectUris: "",
    allowedOrigins: "",
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        fetchCredentials(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchCredentials = async (userId: string) => {
    if (!userId) return;

    try {
      const creds = await getUserApiCredentials(userId);
      setCredentials(creds || []);
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
      setCredentials([]);
    }
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to create an application.");
      return;
    }
    setCreateLoading(true);

    try {
      const clientId = uuidv4();
      const clientSecretRaw = uuidv4();
      const salt = await bcrypt.genSalt(10);
      const clientSecretHashed = await bcrypt.hash(clientSecretRaw, salt);
      const apiKey = uuidv4();

      const newCredentialData: Omit<ApiCredentials, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        name: formData.name,
        description: formData.description,
        clientId,
        clientSecret: clientSecretHashed,
        apiKey,
        redirectUris: formData.redirectUris
          .split(",")
          .map((uri) => uri.trim())
          .filter(uri => uri.length > 0),
        allowedOrigins: formData.allowedOrigins
          .split(",")
          .map((origin) => origin.trim())
          .filter(origin => origin.length > 0),
        scopes: formData.scopes,
        isActive: true,
        rateLimit: { maxRequests: 1000, windowMs: 60000, enabled: true },
      };

      await createApiCredentials(newCredentialData);

      const displayCredential = {
        ...newCredentialData,
        id: 'temp-' + Date.now(),
        clientSecret: clientSecretRaw, // Show raw secret only once
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCredentials([displayCredential, ...credentials]);

      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        redirectUris: "",
        allowedOrigins: "",
        scopes: ["profile", "email"],
      });

      alert(`Application Created!\nClient ID: ${clientId}\nClient Secret: ${clientSecretRaw}\n\nIMPORTANT: Copy your client secret now. You will not be able to see it again.`);

    } catch (error) {
      console.error("Failed to create credentials:", error);
      alert("An unexpected error occurred while creating credentials.");
    } finally {
      setCreateLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear session first
      clearSession();

      // Sign out from Firebase
      await signOutUser();

      // Clear local state
      setUser(null);
      setCredentials([]);
      setShowAccountSelector(false);

      // Redirect to login page
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Sign out error:", error);
      // Force redirect even if there's an error
      clearSession();
      setUser(null);
      window.location.href = "/auth/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user && !isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Authentication Required
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please sign in to access the developer dashboard
            </p>
            <a
              href="/auth/login"
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer transform"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  GLAStudio OAuth
                </h1>
              </div>
              <nav className="hidden md:ml-6 md:flex md:space-x-8">
                <a
                  href="#"
                  className="text-blue-600 border-b-2 border-blue-600 py-2 px-1 text-sm font-medium hover:text-blue-700 transition-colors duration-200 cursor-pointer"
                >
                  Dashboard
                </a>
                <a
                  href="/test"
                  className="text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 py-2 px-1 text-sm font-medium cursor-pointer transition-all duration-200"
                >
                  Test Console
                </a>
                <a
                  href="/api/health"
                  className="text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 py-2 px-1 text-sm font-medium cursor-pointer transition-all duration-200"
                >
                  Health Check
                </a>
              </nav>
            </div>

            {/* User Account Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowAccountSelector(!showAccountSelector)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-2 hover:bg-gray-100 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer transform"
                >
                  <img
                    className="h-8 w-8 rounded-full"
                    src={
                      user.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "User")}&background=3B82F6&color=fff`
                    }
                    alt="Profile"
                  />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName || "User"}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Google-style Account Selector Dropdown */}
                {showAccountSelector && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <img
                          className="h-12 w-12 rounded-full"
                          src={
                            user.photoURL ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "User")}&background=3B82F6&color=fff`
                          }
                          alt="Profile"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || "User"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowAccountSelector(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>Manage your account</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountSelector(false);
                          handleSignOut();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span>Sign out</span>
                        </div>
                      </button>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                      <div className="text-xs text-gray-500 text-center">
                        <p>Privacy Policy • Terms of Service</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.displayName || user.email?.split("@")[0]}!
              </h2>
              <p className="text-gray-600 mt-1">
                Manage your OAuth applications and monitor their usage
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <svg
                  className="h-4 w-4 mr-2"
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
                Create Application
              </button>
              <a
                href="/test"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Test Console
              </a>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Applications
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {credentials.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Requests
                </p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Success Rate
                </p>
                <p className="text-2xl font-semibold text-gray-900">100%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Your Applications
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your OAuth applications and view their credentials
            </p>
          </div>

          {credentials.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No applications
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first OAuth application.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <svg
                    className="h-4 w-4 mr-2"
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
                  Create Application
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-lg font-medium text-gray-900">
                          {credential.name}
                        </h4>
                        <span
                          className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            credential.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {credential.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {credential.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {credential.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          Created:{" "}
                          {new Date(credential.createdAt).toLocaleDateString()}
                        </span>
                        {credential.lastUsed && (
                          <span>
                            Last used:{" "}
                            {new Date(credential.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => copyToClipboard(credential.clientId)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer transition-colors duration-200"
                      >
                        Copy Client ID
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this application?",
                            )
                          ) {
                            // Handle delete
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Application Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Create New Application
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateCredential} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Application Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="My Awesome App"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="A brief description of your application"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Redirect URIs
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.redirectUris}
                    onChange={(e) =>
                      setFormData({ ...formData, redirectUris: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="https://myapp.com/callback, https://localhost:3000/callback"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Comma-separated list of redirect URIs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Allowed Origins
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.allowedOrigins}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowedOrigins: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="https://myapp.com, https://localhost:3000"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Comma-separated list of allowed origins for CORS
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    {createLoading ? "Creating..." : "Create Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

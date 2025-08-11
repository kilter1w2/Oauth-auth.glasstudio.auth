"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserAccessKey {
  id: string;
  userId: string;
  keyName: string;
  accessKey: string;
  keySecret?: string;
  permissions: string[];
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  description?: string;
  usageCount: number;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
}

export default function UserKeysPage() {
  const [user, setUser] = useState<User | null>(null);
  const [accessKeys, setAccessKeys] = useState<UserAccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const router = useRouter();

  // Create key form state
  const [createForm, setCreateForm] = useState({
    keyName: "",
    description: "",
    permissions: ["read"] as string[],
    expiryDays: 0,
    userEmail: "",
  });

  useEffect(() => {
    // Load user's access keys on component mount
    loadUserKeys();
  }, []);

  const loadUserKeys = async () => {
    try {
      setLoading(true);
      setError(null);

      // For demo purposes, we'll use email-based lookup
      // In a real app, you'd get the user from authentication state
      const userEmail = createForm.userEmail || prompt("Please enter your email to load access keys:");

      if (!userEmail) {
        setError("Email is required to load access keys");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/user/access-key?userEmail=${encodeURIComponent(userEmail)}`);
      const result = await response.json();

      if (result.success) {
        setUser(result.data.user);
        setAccessKeys(result.data.accessKeys || []);
        setCreateForm(prev => ({ ...prev, userEmail }));
      } else {
        setError(result.error || "Failed to load access keys");
      }
    } catch (err) {
      console.error("Failed to load access keys:", err);
      setError("Failed to load access keys");
    } finally {
      setLoading(false);
    }
  };

  const createAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("User not found. Please reload the page.");
      return;
    }

    try {
      const response = await fetch("/api/user/access-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          keyName: createForm.keyName,
          description: createForm.description || undefined,
          permissions: createForm.permissions,
          expiryDays: createForm.expiryDays > 0 ? createForm.expiryDays : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the secret to show only once
        setNewKeySecret(result.data.keySecret);

        // Add to list without secret (it won't be returned again)
        setAccessKeys([...accessKeys, { ...result.data, keySecret: undefined }]);

        // Reset form
        setCreateForm({
          ...createForm,
          keyName: "",
          description: "",
          permissions: ["read"],
          expiryDays: 0,
        });
        setShowCreateForm(false);
      } else {
        setError(result.error || "Failed to create access key");
      }
    } catch (err) {
      console.error("Failed to create access key:", err);
      setError("Failed to create access key");
    }
  };

  const deleteAccessKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete the access key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/access-key?keyId=${keyId}&userId=${user?.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setAccessKeys(accessKeys.filter(key => key.id !== keyId));
      } else {
        setError(result.error || "Failed to delete access key");
      }
    } catch (err) {
      console.error("Failed to delete access key:", err);
      setError("Failed to delete access key");
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "write":
        return "bg-yellow-100 text-yellow-800";
      case "read":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading access keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Access Key Management</h1>
              <p className="text-gray-600">
                Manage your API access keys and monitor usage
                {user && <span className="ml-2 text-blue-600">({user.email})</span>}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm"
              >
                Back to Dashboard
              </button>
              <button
                onClick={loadUserKeys}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* New Key Secret Modal */}
        {newKeySecret && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Access Key Created Successfully!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please copy your key secret now. For security reasons, it won't be shown again.
              </p>
              <div className="bg-gray-50 p-3 rounded border">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-gray-800 break-all">{newKeySecret}</code>
                  <button
                    onClick={() => copyToClipboard(newKeySecret, "secret")}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setNewKeySecret(null)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  I've Copied the Secret
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Access Keys Section */}
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Your Access Keys</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create and manage API access keys for your applications
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create New Key
              </button>
            </div>
          </div>

          {/* Create Key Form */}
          {showCreateForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={createAccessKey} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Key Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.keyName}
                      onChange={(e) => setCreateForm({ ...createForm, keyName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="My API Key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expiry (days, 0 = never)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={createForm.expiryDays}
                      onChange={(e) => setCreateForm({ ...createForm, expiryDays: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Optional description for this key"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {["read", "write", "admin"].map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={createForm.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                permissions: [...createForm.permissions, permission],
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                permissions: createForm.permissions.filter((p) => p !== permission),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Create Access Key
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Keys List */}
          <div className="divide-y divide-gray-200">
            {!user ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">Please enter your email to load access keys.</p>
                <button
                  onClick={loadUserKeys}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Load Keys
                </button>
              </div>
            ) : accessKeys.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No access keys yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first access key.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Create Access Key
                  </button>
                </div>
              </div>
            ) : (
              accessKeys.map((key) => (
                <div key={key.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{key.keyName}</h3>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            key.isActive && (!key.expiresAt || new Date(key.expiresAt) > new Date())
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {key.isActive && (!key.expiresAt || new Date(key.expiresAt) > new Date())
                            ? "Active"
                            : "Inactive/Expired"}
                        </span>
                      </div>

                      {key.description && (
                        <p className="mt-1 text-sm text-gray-500">{key.description}</p>
                      )}

                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">Access Key:</span>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                              {key.accessKey}
                            </code>
                            <button
                              onClick={() => copyToClipboard(key.accessKey, key.id)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Copy to clipboard"
                            >
                              {copiedKey === key.id ? (
                                <span className="text-green-600 text-xs">Copied!</span>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">Permissions:</span>
                            {key.permissions.map((permission) => (
                              <span
                                key={permission}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPermissionBadgeColor(permission)}`}
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created: {formatDate(key.createdAt)}</span>
                          {key.lastUsed && (
                            <>
                              <span>•</span>
                              <span>Last used: {formatDate(key.lastUsed)}</span>
                            </>
                          )}
                          {key.expiresAt && (
                            <>
                              <span>•</span>
                              <span>Expires: {formatDate(key.expiresAt)}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Used: {key.usageCount} times</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => deleteAccessKey(key.id, key.keyName)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">How to Use Your Access Keys</h2>
          </div>
          <div className="px-6 py-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 mb-4">
                Use your access keys to authenticate with the GLAStudio OAuth API:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Authentication Header</h4>
                  <code className="block mt-1 p-3 bg-gray-100 rounded text-sm">
                    Authorization: Bearer YOUR_ACCESS_KEY:YOUR_SECRET
                  </code>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Example cURL Request</h4>
                  <code className="block mt-1 p-3 bg-gray-100 rounded text-sm">
                    curl -H "Authorization: Bearer gla_user_xxx:your_secret" \<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp; https://auth-GLAstudio.auth/api/oauth/userinfo
                  </code>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">JavaScript Example</h4>
                  <code className="block mt-1 p-3 bg-gray-100 rounded text-sm">
                    const response = await fetch('/api/oauth/userinfo', {'{'}
                    <br/>&nbsp;&nbsp;headers: {'{'}
                    <br/>&nbsp;&nbsp;&nbsp;&nbsp;'Authorization': 'Bearer gla_user_xxx:your_secret'
                    <br/>&nbsp;&nbsp;{'}'}
                    <br/>{'}'});
                  </code>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-800 mb-2">Important Security Notes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Keep your access keys and secrets secure - treat them like passwords</li>
                  <li>• Never commit keys to version control or share them publicly</li>
                  <li>• Use environment variables to store keys in your applications</li>
                  <li>• Regularly rotate your keys for better security</li>
                  <li>• Delete unused keys immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

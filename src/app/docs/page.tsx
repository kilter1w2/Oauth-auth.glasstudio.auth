"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Shield,
  Users,
  Code,
  Key,
  Globe,
  Zap,
  BookOpen,
  Settings,
  Eye,
  Trash2,
} from "lucide-react";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedText, setCopiedText] = useState("");

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(""), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const CodeBlock = ({
    children,
    language = "bash",
    copyable = true,
  }: {
    children: string;
    language?: string;
    copyable?: boolean;
  }) => (
    <div className="relative bg-gray-900 rounded-lg p-4 my-4">
      <pre className="text-sm text-gray-100 overflow-x-auto">
        <code className={`language-${language}`}>{children}</code>
      </pre>
      {copyable && (
        <button
          onClick={() => copyToClipboard(children, "code")}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
        >
          {copiedText === "code" ? <Check size={16} /> : <Copy size={16} />}
        </button>
      )}
    </div>
  );

  const ApiEndpoint = ({
    method,
    endpoint,
    description,
    example,
  }: {
    method: string;
    endpoint: string;
    description: string;
    example?: string;
  }) => (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            method === "GET"
              ? "bg-green-100 text-green-800"
              : method === "POST"
                ? "bg-blue-100 text-blue-800"
                : method === "DELETE"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
          }`}
        >
          {method}
        </span>
        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {endpoint}
        </code>
      </div>
      <p className="text-gray-700 mb-2">{description}</p>
      {example && (
        <details className="mt-2">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
            Show example
          </summary>
          <CodeBlock language="bash">{example}</CodeBlock>
        </details>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  GLAStudio OAuth
                </h1>
                <p className="text-sm text-gray-600">
                  Complete OAuth Integration Documentation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Settings className="h-4 w-4 mr-1" />
                Dashboard
              </a>
              <a
                href="/auth/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          {[
            { id: "overview", label: "Overview", icon: BookOpen },
            { id: "developer", label: "For Developers", icon: Code },
            { id: "user", label: "For Users", icon: Users },
            { id: "api", label: "API Reference", icon: Globe },
            { id: "examples", label: "Examples", icon: Zap },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to GLAStudio OAuth
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                A powerful, secure OAuth 2.0 provider that makes user
                authentication simple for developers and transparent for users.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <Code className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    For Developers
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Create OAuth apps, view client ID and client secret, and see which users have connected to your app with OAuth. Manage your applications and monitor user connections.
                  </p>
                  <button
                    onClick={() => setActiveTab("developer")}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Developer Guide →
                  </button>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <Users className="h-8 w-8 text-green-600 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    For Users
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Track which apps use OAuth and which you can access. See avatar, name, username, and much more. Manage your connected apps and control data access.
                  </p>
                  <button
                    onClick={() => setActiveTab("user")}
                    className="text-green-600 hover:text-green-800 font-medium"
                  >
                    View User Guide →
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                How It Works
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Key className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">1. Register Your App</h4>
                  <p className="text-gray-600">
                    Create API credentials and get your client ID and secret
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">2. Generate OAuth URL</h4>
                  <p className="text-gray-600">
                    Use our API to create secure authorization URLs
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">3. User Authorization</h4>
                  <p className="text-gray-600">
                    Users securely authorize your app and you receive tokens
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Developer Tab */}
        {activeTab === "developer" && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center mb-6">
                <Code className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Developer Guide
                </h2>
              </div>

              {/* Quick Start */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🚀 Quick Start
                </h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="text-blue-800">
                    Get your OAuth integration running in minutes with our
                    simple API endpoints.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Step 1: Create Your App Credentials
                    </h4>
                    <p className="text-gray-700 mb-3">
                      First, register your application to get client
                      credentials:
                    </p>
                    <CodeBlock language="bash">
                      {`curl -X POST http://localhost:3000/api/credentials \\
  -H "Content-Type: application/json" \\
  -d '{
    "appName": "My Awesome App",
    "description": "OAuth integration for my application",
    "redirectUris": ["https://myapp.com/callback"],
    "allowedOrigins": ["https://myapp.com"],
    "scopes": ["profile", "email"]
  }'`}
                    </CodeBlock>
                    <p className="text-sm text-gray-600">
                      💡 Save the returned <code>clientId</code> and{" "}
                      <code>clientSecret</code> - you'll need them for the next
                      step!
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Step 2: Generate OAuth URL
                    </h4>
                    <p className="text-gray-700 mb-3">
                      Use your credentials to generate a secure OAuth URL:
                    </p>
                    <CodeBlock language="bash">
                      {`curl "http://localhost:3000/api/generate/{client-id}/{client-secret}/grab/?redirect_uri=https://myapp.com/callback&scope=profile email&state=secure_random_string"`}
                    </CodeBlock>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                      <h5 className="font-semibold text-yellow-800 mb-2">
                        Response Format:
                      </h5>
                      <CodeBlock language="json">
                        {`{
  "success": true,
  "data": {
    "oauth_url": "http://localhost:3000/api/oauth2/token?{128-char-encrypted-userid}/{6-char-encrypted-id}/verify?={your-website-url}/{request-id}/{user-id}/{expiry-timestamp}",
    "client_id": "your_client_id",
    "expires_in": 3600
  }
}`}
                      </CodeBlock>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Step 3: Handle User Authorization
                    </h4>
                    <p className="text-gray-700 mb-3">
                      Direct users to the OAuth URL. After authorization,
                      they'll be redirected back with a code:
                    </p>
                    <CodeBlock language="bash">
                      {`# User gets redirected to:
https://myapp.com/callback?code=auth_code_here&state=secure_random_string`}
                    </CodeBlock>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Step 4: Exchange Code for Token
                    </h4>
                    <CodeBlock language="bash">
                      {`curl -X POST http://localhost:3000/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "auth_code_from_redirect",
    "redirect_uri": "https://myapp.com/callback",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'`}
                    </CodeBlock>
                  </div>
                </div>
              </div>

              {/* App Management */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  📱 Developer Dashboard - App Management
                </h3>
                <p className="text-gray-700 mb-4">
                  Access your developer dashboard to manage your OAuth applications, view credentials, and monitor connected users:
                </p>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Eye className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">View App Details</h4>
                        <p className="text-sm text-gray-600">
                          See your client ID, client secret, and app configuration
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Connected Users</h4>
                        <p className="text-sm text-gray-600">
                          Track which users have authorized your app with OAuth
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Key className="h-5 w-5 text-purple-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">API Keys Management</h4>
                        <p className="text-sm text-gray-600">
                          View and manage API keys for your applications
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Settings className="h-5 w-5 text-gray-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">App Settings</h4>
                        <p className="text-sm text-gray-600">
                          Update redirect URIs, scopes, and permissions
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard Features */}
                  <div className="mt-6 p-4 bg-white rounded-lg border">
                    <h5 className="font-semibold text-gray-900 mb-3">Dashboard Features:</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium text-blue-600 mb-2">📊 Analytics</h6>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Total connected users</li>
                          <li>• API usage statistics</li>
                          <li>• Success/failure rates</li>
                          <li>• User activity tracking</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium text-green-600 mb-2">🔐 Security</h6>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Credential management</li>
                          <li>• Rate limiting controls</li>
                          <li>• Access token monitoring</li>
                          <li>• Security event logging</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <a
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Developer Dashboard
                    </a>
                  </div>
                </div>
              </div>

              {/* Advanced Features */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🔧 Advanced Features
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Rate Limiting
                    </h4>
                    <p className="text-blue-800 text-sm">
                      Configure custom rate limits for your API credentials to
                      prevent abuse.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-2">
                      User Analytics
                    </h4>
                    <p className="text-green-800 text-sm">
                      Track user engagement and authorization patterns in your
                      dashboard.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      Webhook Support
                    </h4>
                    <p className="text-purple-800 text-sm">
                      Receive real-time notifications when users authorize or
                      revoke access.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      Token Management
                    </h4>
                    <p className="text-orange-800 text-sm">
                      Automatic token refresh and secure storage handling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Tab */}
        {activeTab === "user" && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center mb-6">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">User Guide</h2>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  👤 Managing Your Connected Apps
                </h3>
                <p className="text-gray-700 mb-4">
                  As a user, you have full control over which applications can
                  access your account. Track which apps use OAuth and which you can access:
                </p>

                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-green-900 mb-3">
                      🔍 View Your Connected Apps
                    </h4>
                    <p className="text-green-800 mb-3">
                      See all applications that have access to your account with avatar, name, username, and much more:
                    </p>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                          MA
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold">My Awesome App</h5>
                          <p className="text-sm text-gray-600">
                            Access to: Profile, Email
                          </p>
                          <p className="text-xs text-gray-500">
                            Connected on: March 15, 2024
                          </p>
                          <p className="text-xs text-gray-500">
                            Last access: March 20, 2024
                          </p>
                        </div>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <a
                      href="/user/apps"
                      className="inline-flex items-center mt-3 text-green-600 hover:text-green-800 font-medium"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View My Apps
                    </a>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">
                      🔒 What Apps Can See
                    </h4>
                    <p className="text-blue-800 mb-3">
                      When you authorize an app, you can see exactly what
                      information it will have access to:
                    </p>
                    <div className="bg-white rounded-lg p-4 border">
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-sm">
                            <strong>Profile:</strong> Your name, username, and
                            avatar
                          </span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-sm">
                            <strong>Email:</strong> Your email address
                          </span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          <span className="text-sm">
                            <strong>Not Shared:</strong> Your password, private
                            messages, or sensitive data
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-red-900 mb-3">
                      🚫 Revoking Access
                    </h4>
                    <p className="text-red-800 mb-3">
                      You can revoke an app's access at any time. This will
                      immediately stop the app from accessing your data:
                    </p>
                    <CodeBlock language="bash">
                      {`# Apps will lose access immediately
# You can re-authorize later if needed`}
                    </CodeBlock>
                  </div>

                  {/* User Profile Management */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-purple-900 mb-3">
                      👤 User Profile Management
                    </h4>
                    <p className="text-purple-800 mb-3">
                      Manage your profile information that apps can access:
                    </p>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-medium text-purple-600 mb-2">Profile Information</h6>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Username and display name</li>
                            <li>• Profile avatar/picture</li>
                            <li>• Email address</li>
                            <li>• Account creation date</li>
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-medium text-purple-600 mb-2">Privacy Controls</h6>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Control what apps can see</li>
                            <li>• Manage data sharing preferences</li>
                            <li>• View access history</li>
                            <li>• Set profile visibility</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <a
                      href="/user/profile"
                      className="inline-flex items-center mt-3 text-purple-600 hover:text-purple-800 font-medium"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Manage My Profile
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Reference Tab */}
        {activeTab === "api" && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center mb-6">
                <Globe className="h-8 w-8 text-purple-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">
                  REST API Reference
                </h2>
              </div>

              {/* OAuth Flow Endpoints */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🔐 OAuth Flow Endpoints
                </h3>

                <ApiEndpoint
                  method="GET"
                  endpoint="/api/generate/{id}/{apiKey}/grab"
                  description="Your requested OAuth URL generator. Generates secure OAuth authorization URL for user login."
                  example={`curl "http://localhost:3000/api/generate/your_client_id/your_api_key/grab?redirect_uri=https://yourapp.com/callback&scope=profile email&state=random123"`}
                />

                <ApiEndpoint
                  method="GET"
                  endpoint="/api/oauth/authorize"
                  description="OAuth authorization endpoint where users grant permission to your app."
                  example={`# Users visit this URL (generated from /api/generate endpoint)
http://localhost:3000/api/oauth/authorize?client_id=your_client_id&redirect_uri=https://yourapp.com/callback&scope=profile email&state=random123`}
                />

                <ApiEndpoint
                  method="POST"
                  endpoint="/api/oauth/token"
                  description="Token exchange endpoint. Exchange authorization code for access token."
                  example={`curl -X POST http://localhost:3000/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "auth_code_from_redirect",
    "redirect_uri": "https://yourapp.com/callback",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'`}
                />

                <ApiEndpoint
                  method="GET"
                  endpoint="/api/oauth2/token?{128-char-encrypted-userid}/{6-char-encrypted-id}/verify?={website-url}/{request-id}/{user-id}/{expiry-timestamp}"
                  description="Secure redirect URL with encrypted parameters. Generated automatically by the system with your specified URL structure."
                />
              </div>

              {/* Developer API */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🧑‍💻 Developer Management API
                </h3>

                <ApiEndpoint
                  method="POST"
                  endpoint="/api/credentials"
                  description="Create new API credentials (client ID and secret)."
                  example={`curl -X POST http://localhost:3000/api/credentials \\
  -H "Content-Type: application/json" \\
  -d '{
    "appName": "My App",
    "description": "My OAuth app",
    "redirectUris": ["https://myapp.com/callback"],
    "scopes": ["profile", "email"]
  }'`}
                />

                <ApiEndpoint
                  method="GET"
                  endpoint="/api/keys/{userId}"
                  description="API keys management. View and manage API keys for a specific user."
                  example={`curl http://localhost:3000/api/keys/user_123456`}
                />

                <ApiEndpoint
                  method="GET"
                  endpoint="/api/apps/{clientId}"
                  description="View app details, credentials, and connected users with analytics."
                  example={`curl http://localhost:3000/api/apps/your_client_id`}
                />
              </div>

              {/* User API */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  👤 User Management API
                </h3>

                <ApiEndpoint
                  method="GET"
                  endpoint="/api/user/apps"
                  description="List all apps the user has authorized with their details (avatar, name, username, etc)."
                  example={`curl http://localhost:3000/api/user/apps \\
  -H "Authorization: Bearer your_access_token"`}
                />

                <ApiEndpoint
                  method="DELETE"
                  endpoint="/api/user/revoke/{appId}"
                  description="Revoke access for a specific app."
                  example={`curl -X DELETE http://localhost:3000/api/user/revoke/app_123 \\
  -H "Authorization: Bearer your_access_token"`}
                />

                <ApiEndpoint
                  method="GET"
                  endpoint="/api/user/profile"
                  description="Get user profile information (avatar, username, name, etc)."
                  example={`curl http://localhost:3000/api/user/profile \\
  -H "Authorization: Bearer your_access_token"`}
                />
              </div>

              {/* OAuth URL Structure */}
              <div className="mt-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🔐 OAuth URL Structure
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-yellow-900 mb-3">
                    Generated OAuth URL Format
                  </h4>
                  <p className="text-yellow-800 mb-3">
                    When you call the generate endpoint, you'll receive a secure
                    OAuth URL with this exact structure:
                  </p>
                  <CodeBlock language="text">
                    {`/api/oauth2/token?{128-char-encrypted-userid}/{6-char-randomized-encrypted-id}/verify?={registered-website-url}/{request-id}/{user-id}/{expiry-timestamp}`}
                  </CodeBlock>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-40">
                        128-char-userid:
                      </span>
                      <span className="text-yellow-800">
                        User ID encrypted 128 characters for security
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-40">
                        6-char-id:
                      </span>
                      <span className="text-yellow-800">
                        Random ID encrypted 10 times, 6 characters
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-40">
                        website-url:
                      </span>
                      <span className="text-yellow-800">
                        The website URL that is registered in app dev used
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-40">
                        request-id:
                      </span>
                      <span className="text-yellow-800">
                        Unique request identifier
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-40">
                        user-id:
                      </span>
                      <span className="text-yellow-800">
                        Numeric user ID
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-40">
                        expiry-timestamp:
                      </span>
                      <span className="text-yellow-800">
                        Time to make like expired
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === "examples" && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center mb-6">
                <Zap className="h-8 w-8 text-yellow-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Integration Examples
                </h2>
              </div>

              {/* JavaScript Example */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🟨 JavaScript/Node.js
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Generate OAuth URL
                    </h4>
                    <CodeBlock language="javascript">
                      {`// Generate OAuth URL for user authorization
async function generateOAuthUrl(clientId, apiKey, redirectUri) {
  const response = await fetch(
    \`http://localhost:3000/api/generate/\${clientId}/\${apiKey}/grab?\` +
    new URLSearchParams({
      redirect_uri: redirectUri,
      scope: 'profile email',
      state: generateRandomState()
    })
  );

  const data = await response.json();
  if (data.success) {
    // Redirect user to OAuth URL
    window.location.href = data.data.oauth_url;
  }
  return data;
}

function generateRandomState() {
  return Math.random().toString(36).substring(2, 15);
}`}
                    </CodeBlock>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Handle OAuth Callback
                    </h4>
                    <CodeBlock language="javascript">
                      {`// Handle the callback after user authorization
async function handleOAuthCallback(code, state, clientId, clientSecret, redirectUri) {
  const response = await fetch('http://localhost:3000/api/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const tokenData = await response.json();
  if (tokenData.access_token) {
    // Store the access token securely
    localStorage.setItem('oauth_token', tokenData.access_token);
    return tokenData;
  }
}`}
                    </CodeBlock>
                  </div>
                </div>
              </div>

              {/* Python Example */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🐍 Python
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Python OAuth Client
                    </h4>
                    <CodeBlock language="python">
                      {`import requests
import secrets
from urllib.parse import urlencode

class GLAStudioOAuth:
    def __init__(self, client_id, api_key, redirect_uri):
        self.client_id = client_id
        self.api_key = api_key
        self.redirect_uri = redirect_uri
        self.base_url = "http://localhost:3000"

    def generate_oauth_url(self, scope="profile email"):
        """Generate OAuth authorization URL"""
        state = secrets.token_urlsafe(32)

        response = requests.get(
            f"{self.base_url}/api/generate/{self.client_id}/{self.api_key}/grab",
            params={
                'redirect_uri': self.redirect_uri,
                'scope': scope,
                'state': state
            }
        )

        if response.status_code == 200:
            data = response.json()
            return data['data']['oauth_url'], state
        else:
            raise Exception(f"Failed to generate OAuth URL: {response.text}")

    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token"""
        response = requests.post(
            f"{self.base_url}/api/oauth/token",
            json={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.redirect_uri,
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }
        )

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Token exchange failed: {response.text}")

# Usage example
oauth_client = GLAStudioOAuth(
    client_id="your_client_id",
    api_key="your_api_key",
    redirect_uri="https://yourapp.com/callback"
)

# Generate OAuth URL
oauth_url, state = oauth_client.generate_oauth_url()
print(f"Direct users to: {oauth_url}")

# After user authorization, exchange code for token
# token_data = oauth_client.exchange_code_for_token(authorization_code)`}
                    </CodeBlock>
                  </div>
                </div>
              </div>

              {/* PHP Example */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🐘 PHP
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      PHP OAuth Client
                    </h4>
                    <CodeBlock language="php">
                      {`<?php
class GLAStudioOAuth {
    private $clientId;
    private $clientSecret;
    private $redirectUri;
    private $baseUrl = "http://localhost:3000";

    public function __construct($clientId, $clientSecret, $redirectUri) {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->redirectUri = $redirectUri;
    }

    public function generateOAuthUrl($scope = "profile email") {
        $state = bin2hex(random_bytes(16));

        $params = http_build_query([
            'redirect_uri' => $this->redirectUri,
            'scope' => $scope,
            'state' => $state
        ]);

        $url = "{$this->baseUrl}/api/generate/{$this->clientId}/{$this->clientSecret}/grab/?{$params}";

        $response = file_get_contents($url);
        $data = json_decode($response, true);

        if ($data['success']) {
            return [$data['data']['oauth_url'], $state];
        } else {
            throw new Exception("Failed to generate OAuth URL: " . $response);
        }
    }

    public function exchangeCodeForToken($code) {
        $postData = json_encode([
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret
        ]);

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => $postData
            ]
        ]);

        $response = file_get_contents("{$this->baseUrl}/api/oauth/token", false, $context);
        return json_decode($response, true);
    }
}

// Usage
$oauth = new GLAStudioOAuth(
    "your_client_id",
    "your_client_secret",
    "https://yourapp.com/callback"
);

// Generate OAuth URL
list($oauthUrl, $state) = $oauth->generateOAuthUrl();
header("Location: $oauthUrl");
exit();
?>`}
                    </CodeBlock>
                  </div>
                </div>
              </div>

              {/* cURL Examples */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🔧 cURL Examples
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Complete OAuth Flow with cURL
                    </h4>
                    <CodeBlock language="bash">
                      {`# Step 1: Create App Credentials
curl -X POST http://localhost:3000/api/credentials \\
  -H "Content-Type: application/json" \\
  -d '{
    "appName": "My Test App",
    "description": "Testing OAuth integration",
    "redirectUris": ["https://myapp.com/callback"],
    "scopes": ["profile", "email"]
  }'

# Step 2: Generate OAuth URL (replace with your actual credentials)
curl "http://localhost:3000/api/generate/your_client_id/your_api_key/grab?redirect_uri=https://myapp.com/callback&scope=profile email&state=random123"

# Step 3: After user authorization, exchange code for token
curl -X POST http://localhost:3000/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "code_from_callback",
    "redirect_uri": "https://myapp.com/callback",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'

# Step 4: Use access token to get user info
curl http://localhost:3000/api/user/profile \\
  -H "Authorization: Bearer your_access_token"`}
                    </CodeBlock>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Developer Management Commands
                    </h4>
                    <CodeBlock language="bash">
                      {`# View your API keys and credentials
curl http://localhost:3000/api/keys/your_user_id

# View app details and connected users
curl http://localhost:3000/api/apps/your_client_id

# Get user's connected apps
curl http://localhost:3000/api/user/apps \\
  -H "Authorization: Bearer user_access_token"

# Revoke app access (as user)
curl -X DELETE http://localhost:3000/api/user/revoke/app_id \\
  -H "Authorization: Bearer user_access_token"`}
                    </CodeBlock>
                  </div>
                </div>
              </div>

              {/* OAuth URL Structure */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  🔐 OAuth URL Structure
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-yellow-900 mb-3">
                    Generated OAuth URL Format
                  </h4>
                  <p className="text-yellow-800 mb-3">
                    When you call the generate endpoint, you'll receive a secure
                    OAuth URL with this structure:
                  </p>
                  <CodeBlock language="text">
                    {`http://localhost:3000/api/oauth2/token?{128-char-encrypted-userid}/{6-char-randomized-encrypted-id}/verify?={registered-website-url}/{request-id}/{user-id}/{expiry-timestamp}`}
                  </CodeBlock>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-32">
                        128-char-userid:
                      </span>
                      <span className="text-yellow-800">
                        Encrypted user identifier for security
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-32">
                        6-char-id:
                      </span>
                      <span className="text-yellow-800">
                        Randomized encrypted request identifier
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-32">
                        website-url:
                      </span>
                      <span className="text-yellow-800">
                        Your registered redirect URI
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-32">
                        request-id:
                      </span>
                      <span className="text-yellow-800">
                        Unique request identifier
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-yellow-900 w-32">
                        expiry:
                      </span>
                      <span className="text-yellow-800">
                        Timestamp when the URL expires
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/dashboard"
                    className="text-gray-600 hover:text-blue-600"
                  >
                    Developer Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/user/apps"
                    className="text-gray-600 hover:text-blue-600"
                  >
                    My Connected Apps
                  </a>
                </li>
                <li>
                  <a
                    href="/auth/login"
                    className="text-gray-600 hover:text-blue-600"
                  >
                    Login
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                API Endpoints
              </h4>
              <ul className="space-y-2">
                <li>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/generate/{"{id}"}/{"{apiKey}"}/grab
                  </code>
                </li>
                <li>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/oauth/authorize
                  </code>
                </li>
                <li>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/oauth/token
                  </code>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/api-test"
                    className="text-gray-600 hover:text-blue-600"
                  >
                    API Testing
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@glasstudio.com"
                    className="text-gray-600 hover:text-blue-600"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 mt-6 text-center text-gray-600">
            <p>&copy; 2024 GLAStudio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

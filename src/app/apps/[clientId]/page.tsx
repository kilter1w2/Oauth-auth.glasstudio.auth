"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Eye,
  Users,
  Key,
  Copy,
  Check,
  Settings,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  Globe,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  User,
  Mail,
  Zap,
} from "lucide-react";

interface ConnectedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  username: string;
  connectedAt: string;
  lastUsed: string;
  permissions: string[];
  status: "active" | "expired" | "revoked";
}

interface AppDetails {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  redirectUris: string[];
  allowedOrigins: string[];
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  totalUsers: number;
  activeUsers: number;
  connectedUsers: ConnectedUser[];
  stats: {
    totalRequests: number;
    requestsThisMonth: number;
    avgResponseTime: number;
    successRate: number;
  };
}

export default function AppDetailsPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [app, setApp] = useState<AppDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockApp: AppDetails = {
      id: "app_1",
      name: "TaskManager Pro",
      description:
        "A comprehensive project management and task tracking application that helps teams collaborate effectively and manage their workflows.",
      clientId: clientId,
      clientSecret: "gls_tm_secret_456789abcdef",
      apiKey: "gla_tm_api_789012345678",
      redirectUris: [
        "https://taskmanager.com/callback",
        "https://taskmanager.com/auth/oauth",
      ],
      allowedOrigins: [
        "https://taskmanager.com",
        "https://app.taskmanager.com",
      ],
      scopes: ["profile", "email"],
      isActive: true,
      createdAt: "2024-03-01T10:00:00Z",
      updatedAt: "2024-03-15T14:30:00Z",
      lastUsed: "2024-03-20T14:30:00Z",
      totalUsers: 1247,
      activeUsers: 892,
      stats: {
        totalRequests: 15432,
        requestsThisMonth: 3456,
        avgResponseTime: 250,
        successRate: 99.2,
      },
      connectedUsers: [
        {
          id: "user_1",
          name: "John Doe",
          email: "john@example.com",
          avatar: "https://via.placeholder.com/40/3B82F6/FFFFFF?text=JD",
          username: "johndoe",
          connectedAt: "2024-03-15T10:30:00Z",
          lastUsed: "2024-03-20T14:22:00Z",
          permissions: ["profile", "email"],
          status: "active",
        },
        {
          id: "user_2",
          name: "Jane Smith",
          email: "jane@example.com",
          avatar: "https://via.placeholder.com/40/10B981/FFFFFF?text=JS",
          username: "janesmith",
          connectedAt: "2024-03-10T16:45:00Z",
          lastUsed: "2024-03-19T09:15:00Z",
          permissions: ["profile", "email"],
          status: "active",
        },
        {
          id: "user_3",
          name: "Bob Wilson",
          email: "bob@example.com",
          username: "bobwilson",
          connectedAt: "2024-02-28T12:00:00Z",
          lastUsed: "2024-03-01T11:30:00Z",
          permissions: ["profile"],
          status: "expired",
        },
        {
          id: "user_4",
          name: "Alice Johnson",
          email: "alice@example.com",
          avatar: "https://via.placeholder.com/40/8B5CF6/FFFFFF?text=AJ",
          username: "alicejohnson",
          connectedAt: "2024-01-15T08:20:00Z",
          lastUsed: "2024-01-20T12:30:00Z",
          permissions: ["profile", "email"],
          status: "revoked",
        },
      ],
    };

    setTimeout(() => {
      setApp(mockApp);
      setLoading(false);
    }, 800);
  }, [clientId]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(""), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "revoked":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "revoked":
        return <Trash2 className="h-4 w-4" />;
      case "expired":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const generateOAuthUrl = (app: AppDetails) => {
    return `http://localhost:3000/api/generate/${app.clientId}/${app.clientSecret}/grab/`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The application with ID "{clientId}" could not be found.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <a
                href="/dashboard"
                className="text-gray-400 hover:text-gray-600 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </a>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4">
                {app.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
                <p className="text-sm text-gray-600">{app.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  app.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {getStatusIcon(app.isActive ? "active" : "revoked")}
                <span className="ml-1">
                  {app.isActive ? "Active" : "Inactive"}
                </span>
              </span>
              <button className="text-gray-600 hover:text-gray-800 flex items-center">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {app.totalUsers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {app.activeUsers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Requests/Month
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {app.stats.requestsThisMonth}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-3">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Success Rate
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {app.stats.successRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          {[
            { id: "overview", label: "Overview", icon: Eye },
            { id: "credentials", label: "API Credentials", icon: Key },
            { id: "users", label: "Connected Users", icon: Users },
            { id: "integration", label: "Integration", icon: Globe },
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Application Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {app.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Description
                    </label>
                    <p className="text-gray-700">{app.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Client ID
                    </label>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {app.clientId}
                    </code>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Created
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatDate(app.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatDate(app.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Redirect URIs
                    </label>
                    <div className="space-y-1">
                      {app.redirectUris.map((uri, index) => (
                        <code
                          key={index}
                          className="block text-sm bg-gray-100 px-2 py-1 rounded"
                        >
                          {uri}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Allowed Origins
                    </label>
                    <div className="space-y-1">
                      {app.allowedOrigins.map((origin, index) => (
                        <code
                          key={index}
                          className="block text-sm bg-gray-100 px-2 py-1 rounded"
                        >
                          {origin}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Scopes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {app.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Usage Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Total API Requests
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {app.stats.totalRequests.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Requests This Month
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {app.stats.requestsThisMonth.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Average Response Time
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {app.stats.avgResponseTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Success Rate
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      {app.stats.successRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      copyToClipboard(generateOAuthUrl(app), "oauthUrl")
                    }
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copiedText === "oauthUrl" ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy OAuth Generation URL
                  </button>
                  <a
                    href="/docs"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Integration Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Tab */}
        {activeTab === "credentials" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Key className="h-6 w-6 mr-2" />
              API Credentials
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-50 px-4 py-3 rounded-lg border text-sm font-mono">
                      {app.clientId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(app.clientId, "clientId")}
                      className="p-3 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg border"
                    >
                      {copiedText === "clientId" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-50 px-4 py-3 rounded-lg border text-sm font-mono">
                      {app.clientSecret.substring(0, 8)}...
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(app.clientSecret, "clientSecret")
                      }
                      className="p-3 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg border"
                    >
                      {copiedText === "clientSecret" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Keep this secret secure. Never expose it in client-side
                    code.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-50 px-4 py-3 rounded-lg border text-sm font-mono">
                      {app.apiKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(app.apiKey, "apiKey")}
                      className="p-3 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg border"
                    >
                      {copiedText === "apiKey" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  OAuth URL Generator
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    Use this URL to generate OAuth authorization links:
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono break-all">
                      {generateOAuthUrl(app)}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(generateOAuthUrl(app), "fullOAuthUrl")
                      }
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      {copiedText === "fullOAuthUrl" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Add query parameters: ?redirect_uri=YOUR_URI&scope=profile
                    email&state=RANDOM_STRING
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Connected Users ({app.connectedUsers.length})
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                    {
                      app.connectedUsers.filter((u) => u.status === "active")
                        .length
                    }{" "}
                    active
                  </span>
                  <span className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                    {
                      app.connectedUsers.filter((u) => u.status === "expired")
                        .length
                    }{" "}
                    expired
                  </span>
                  <span className="flex items-center">
                    <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                    {
                      app.connectedUsers.filter((u) => u.status === "revoked")
                        .length
                    }{" "}
                    revoked
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {app.connectedUsers.length > 0 ? (
                <div className="space-y-4">
                  {app.connectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={`${user.name} avatar`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {user.name}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}
                              >
                                {getStatusIcon(user.status)}
                                <span className="ml-1 capitalize">
                                  {user.status}
                                </span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center">
                              <User className="h-4 w-4 mr-1" />@{user.username}
                              <Mail className="h-4 w-4 ml-3 mr-1" />
                              {user.email}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Connected: {formatDate(user.connectedAt)}
                              </span>
                              <span className="flex items-center">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Last used: {formatDate(user.lastUsed)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.permissions.map((permission) => (
                                <span
                                  key={permission}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    No Connected Users
                  </h4>
                  <p className="text-gray-600 mb-6">
                    No users have authorized this application yet. Share your
                    OAuth URL to get started.
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(generateOAuthUrl(app), "shareUrl")
                    }
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copiedText === "shareUrl" ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy OAuth URL
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Integration Tab */}
        {activeTab === "integration" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Globe className="h-6 w-6 mr-2" />
              Integration Examples
            </h3>

            <div className="space-y-8">
              {/* OAuth Flow Example */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Complete OAuth Flow
                </h4>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-100 overflow-x-auto">
                    {`# Step 1: Generate OAuth URL
curl "http://localhost:3000/api/generate/${app.clientId}/${app.clientSecret}/grab/?redirect_uri=https://yourapp.com/callback&scope=profile email&state=random123"

# Step 2: User visits the returned OAuth URL and authorizes your app

# Step 3: Exchange authorization code for access token
curl -X POST http://localhost:3000/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "auth_code_from_callback",
    "redirect_uri": "https://yourapp.com/callback",
    "client_id": "${app.clientId}",
    "client_secret": "${app.clientSecret}"
  }'`}
                  </pre>
                </div>
              </div>

              {/* JavaScript Example */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  JavaScript Integration
                </h4>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-100 overflow-x-auto">
                    {`// Generate OAuth URL
const response = await fetch(
  'http://localhost:3000/api/generate/${app.clientId}/${app.clientSecret}/grab/?' +
  new URLSearchParams({
    redirect_uri: 'https://yourapp.com/callback',
    scope: 'profile email',
    state: 'random123'
  })
);

const data = await response.json();
if (data.success) {
  window.location.href = data.data.oauth_url;
}`}
                  </pre>
                </div>
              </div>

              {/* Response Format */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Expected Response Format
                </h4>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-100 overflow-x-auto">
                    {`{
  "success": true,
  "data": {
    "oauth_url": "http://localhost:3000/api/oauth2/token?{128-char-encrypted-userid}/{6-char-encrypted-id}/verify?={your-website-url}/{request-id}/{user-id}/{expiry-timestamp}",
    "client_id": "${app.clientId}",
    "expires_in": 3600
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-red-900 mb-2">
                      🔒 Security Requirements
                    </h5>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>
                        • Client Secret must be kept secure and never exposed in
                        frontend code
                      </li>
                      <li>
                        • Always validate the state parameter to prevent CSRF
                        attacks
                      </li>
                      <li>• Use HTTPS for all redirect URIs in production</li>
                      <li>
                        • Store access tokens securely and implement proper
                        token refresh
                      </li>
                      <li>
                        • The OAuth URL contains encrypted parameters that
                        expire after use
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "revoked":
      return "bg-red-100 text-red-800";
    case "expired":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4" />;
    case "revoked":
      return <Trash2 className="h-4 w-4" />;
    case "expired":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return null;
  }
}

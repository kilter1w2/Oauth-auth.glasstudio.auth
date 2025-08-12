'use client';

import { useState, useEffect } from 'react';
import { Eye, Trash2, Shield, Calendar, Globe, User, Mail, Image, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ConnectedApp {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  website?: string;
  developer: {
    name: string;
    email: string;
  };
  permissions: string[];
  connectedAt: string;
  lastUsed: string;
  status: 'active' | 'revoked' | 'expired';
}

export default function UserAppsPage() {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockApps: ConnectedApp[] = [
      {
        id: 'app_1',
        name: 'TaskManager Pro',
        description: 'Project management and task tracking application',
        avatar: 'https://via.placeholder.com/64/3B82F6/FFFFFF?text=TM',
        website: 'https://taskmanager.com',
        developer: {
          name: 'TaskManager Inc.',
          email: 'dev@taskmanager.com'
        },
        permissions: ['profile', 'email'],
        connectedAt: '2024-03-15T10:30:00Z',
        lastUsed: '2024-03-20T14:22:00Z',
        status: 'active'
      },
      {
        id: 'app_2',
        name: 'SocialHub',
        description: 'Social media management dashboard',
        avatar: 'https://via.placeholder.com/64/10B981/FFFFFF?text=SH',
        website: 'https://socialhub.app',
        developer: {
          name: 'Social Solutions',
          email: 'hello@socialhub.app'
        },
        permissions: ['profile', 'email', 'social_posts'],
        connectedAt: '2024-02-28T16:45:00Z',
        lastUsed: '2024-03-19T09:15:00Z',
        status: 'active'
      },
      {
        id: 'app_3',
        name: 'Analytics Plus',
        description: 'Advanced analytics and reporting tool',
        avatar: 'https://via.placeholder.com/64/8B5CF6/FFFFFF?text=AP',
        website: 'https://analyticsplus.io',
        developer: {
          name: 'Data Insights Co.',
          email: 'support@analyticsplus.io'
        },
        permissions: ['profile'],
        connectedAt: '2024-01-10T12:00:00Z',
        lastUsed: '2024-02-15T11:30:00Z',
        status: 'expired'
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setApps(mockApps);
      setLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'revoked':
        return <AlertCircle className="h-4 w-4" />;
      case 'expired':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleRevokeAccess = async (appId: string) => {
    setRevoking(appId);
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setApps(apps.map(app =>
        app.id === appId ? { ...app, status: 'revoked' as const } : app
      ));
    } catch (err) {
      setError('Failed to revoke access. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'profile':
        return <User className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'social_posts':
        return <Globe className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'profile':
        return 'Profile Information';
      case 'email':
        return 'Email Address';
      case 'social_posts':
        return 'Social Media Posts';
      default:
        return permission;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your connected apps...</p>
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
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Connected Apps</h1>
                <p className="text-sm text-gray-600">Manage your OAuth authorizations and privacy settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/docs" className="text-blue-600 hover:text-blue-800 flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                Documentation
              </a>
              <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Apps</p>
                <p className="text-2xl font-semibold text-gray-900">{apps.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {apps.filter(app => app.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-3">
                <RefreshCw className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {apps.filter(app => app.status === 'expired').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-full p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revoked</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {apps.filter(app => app.status === 'revoked').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Apps List */}
        <div className="space-y-6">
          {apps.map((app) => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* App Avatar */}
                    <div className="flex-shrink-0">
                      {app.avatar ? (
                        <img
                          src={app.avatar}
                          alt={`${app.name} logo`}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                          {app.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* App Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{app.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{app.status}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{app.description}</p>

                      {/* Developer Info */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>By {app.developer.name}</span>
                        {app.website && (
                          <a
                            href={app.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Visit Website
                          </a>
                        )}
                      </div>

                      {/* Permissions */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions:</h4>
                        <div className="flex flex-wrap gap-2">
                          {app.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {getPermissionIcon(permission)}
                              <span className="ml-1">{getPermissionLabel(permission)}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Connected: {formatDate(app.connectedAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          <span>Last used: {formatDate(app.lastUsed)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-start space-x-2">
                    {app.status === 'active' && (
                      <button
                        onClick={() => handleRevokeAccess(app.id)}
                        disabled={revoking === app.id}
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {revoking === app.id ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {revoking === app.id ? 'Revoking...' : 'Revoke Access'}
                      </button>
                    )}
                    {app.status === 'expired' && (
                      <button className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reauthorize
                      </button>
                    )}
                    {app.status === 'revoked' && (
                      <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Access Revoked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details (when status is not active) */}
              {app.status !== 'active' && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center text-sm">
                    {app.status === 'revoked' && (
                      <p className="text-red-700">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        This app can no longer access your account. You can reauthorize it at any time.
                      </p>
                    )}
                    {app.status === 'expired' && (
                      <p className="text-yellow-700">
                        <RefreshCw className="h-4 w-4 inline mr-2" />
                        This app's authorization has expired. Click "Reauthorize" to grant access again.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {apps.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Connected Apps</h3>
            <p className="text-gray-600 mb-6">
              You haven't authorized any applications yet. When you do, they'll appear here.
            </p>
            <a
              href="/docs"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              Learn More
            </a>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Your Privacy Matters</h4>
              <div className="text-blue-800 space-y-2">
                <p>• You can revoke access to any app at any time</p>
                <p>• Apps only see the permissions you explicitly granted</p>
                <p>• Your password and sensitive data are never shared</p>
                <p>• All access is logged and monitored for security</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getPermissionIcon(permission: string) {
    switch (permission) {
      case 'profile':
        return <User className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'social_posts':
        return <Globe className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  }

  function getPermissionLabel(permission: string): string {
    switch (permission) {
      case 'profile':
        return 'Profile Information';
      case 'email':
        return 'Email Address';
      case 'social_posts':
        return 'Social Media Posts';
      default:
        return permission.charAt(0).toUpperCase() + permission.slice(1);
    }
  }
}

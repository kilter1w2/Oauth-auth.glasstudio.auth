'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HealthStatus {
  status: string;
  timestamp: string;
  response_time_ms: number;
  version: string;
  system: {
    environment: any;
    firebase: any;
    database_tests: any;
    rate_limiting: any;
    oauth: any;
    security: any;
  };
  issues: {
    critical: string[];
    warnings: string[];
  };
  endpoints: {
    authorization: string;
    token: string;
    userinfo: string;
    dashboard: string;
  };
  next_steps: string[];
}

interface TestCredentials {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  name: string;
  redirectUris: string[];
}

export default function TestPage() {
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testCredentials, setTestCredentials] = useState<TestCredentials | null>(null);
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('health');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to check health:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTestCredentials = () => {
    const credentials: TestCredentials = {
      clientId: `gla_${Math.random().toString(36).substring(2, 34)}`,
      clientSecret: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      apiKey: `gla_api_${Math.random().toString(36).substring(2, 42)}`,
      name: 'Test Application',
      redirectUris: [
        window.location.origin + '/test/callback',
        'http://localhost:3000/test/callback'
      ]
    };
    setTestCredentials(credentials);
  };

  const generateAuthUrl = () => {
    if (!testCredentials) {
      alert('Please generate test credentials first');
      return;
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: testCredentials.clientId,
      redirect_uri: testCredentials.redirectUris[0],
      scope: 'profile email',
      state: 'test_state_' + Math.random().toString(36).substring(2)
    });

    const url = `${window.location.origin}/api/oauth/authorize?${params.toString()}`;
    setAuthUrl(url);
  };

  const exchangeCodeForToken = async () => {
    if (!authCode || !testCredentials) {
      alert('Please enter authorization code and ensure test credentials are generated');
      return;
    }

    try {
      const response = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: testCredentials.clientId,
          client_secret: testCredentials.clientSecret,
          redirect_uri: testCredentials.redirectUris[0]
        })
      });

      const data = await response.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
      } else {
        alert('Failed to get access token: ' + JSON.stringify(data, null, 2));
      }
    } catch (error) {
      alert('Error exchanging code for token: ' + error);
    }
  };

  const getUserInfo = async () => {
    if (!accessToken) {
      alert('Please get an access token first');
      return;
    }

    try {
      const response = await fetch('/api/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      alert('Error getting user info: ' + error);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      healthy_with_warnings: 'bg-yellow-100 text-yellow-800',
      unhealthy: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GLAStudio OAuth Test Console</h1>
          <p className="mt-2 text-gray-600">
            Test and debug your OAuth implementation
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'health', label: 'System Health' },
              { id: 'credentials', label: 'Test Credentials' },
              { id: 'flow', label: 'OAuth Flow' },
              { id: 'endpoints', label: 'API Testing' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* System Health Tab */}
        {activeTab === 'health' && healthStatus && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">System Status</h2>
                <StatusBadge status={healthStatus.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900">Response Time</h3>
                  <p className="text-2xl font-bold text-blue-600">{healthStatus.response_time_ms}ms</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900">Environment</h3>
                  <p className="text-lg text-gray-600">{healthStatus.system.environment.node_env}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900">Version</h3>
                  <p className="text-lg text-gray-600">{healthStatus.version}</p>
                </div>
              </div>

              {healthStatus.issues.critical.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                  <h3 className="font-medium text-red-800 mb-2">Critical Issues</h3>
                  <ul className="text-red-700 space-y-1">
                    {healthStatus.issues.critical.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {healthStatus.issues.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Warnings</h3>
                  <ul className="text-yellow-700 space-y-1">
                    {healthStatus.issues.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-medium text-blue-800 mb-2">Next Steps</h3>
                <ul className="text-blue-700 space-y-1">
                  {healthStatus.next_steps.map((step, index) => (
                    <li key={index}>• {step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Test Credentials Tab */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Generate Test Credentials</h2>
              <p className="text-gray-600 mb-4">
                Generate temporary credentials for testing OAuth flows. These are not stored in the database.
              </p>

              <button
                onClick={generateTestCredentials}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Generate Test Credentials
              </button>

              {testCredentials && (
                <div className="mt-6 space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium mb-2">Client ID</h3>
                    <code className="text-sm bg-gray-100 p-2 rounded block">{testCredentials.clientId}</code>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium mb-2">Client Secret</h3>
                    <code className="text-sm bg-gray-100 p-2 rounded block">{testCredentials.clientSecret}</code>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium mb-2">API Key</h3>
                    <code className="text-sm bg-gray-100 p-2 rounded block">{testCredentials.apiKey}</code>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium mb-2">Redirect URIs</h3>
                    {testCredentials.redirectUris.map((uri, index) => (
                      <code key={index} className="text-sm bg-gray-100 p-2 rounded block mb-1">{uri}</code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OAuth Flow Tab */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Test OAuth 2.0 Flow</h2>

              <div className="space-y-6">
                {/* Step 1: Generate Authorization URL */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium mb-2">Step 1: Generate Authorization URL</h3>
                  <button
                    onClick={generateAuthUrl}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-2"
                  >
                    Generate Authorization URL
                  </button>
                  {authUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Authorization URL:</p>
                      <div className="bg-gray-100 p-2 rounded text-sm break-all">{authUrl}</div>
                      <a
                        href={authUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Open Authorization URL
                      </a>
                    </div>
                  )}
                </div>

                {/* Step 2: Exchange Code for Token */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-medium mb-2">Step 2: Exchange Authorization Code for Token</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter authorization code from callback"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                    <button
                      onClick={exchangeCodeForToken}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    >
                      Exchange for Token
                    </button>
                  </div>
                  {accessToken && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Access Token:</p>
                      <div className="bg-gray-100 p-2 rounded text-sm break-all">{accessToken}</div>
                    </div>
                  )}
                </div>

                {/* Step 3: Get User Info */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium mb-2">Step 3: Get User Information</h3>
                  <button
                    onClick={getUserInfo}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Get User Info
                  </button>
                  {userInfo && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">User Information:</p>
                      <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                        {JSON.stringify(userInfo, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Testing Tab */}
        {activeTab === 'endpoints' && healthStatus && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>

              <div className="space-y-4">
                {Object.entries(healthStatus.endpoints).map(([name, url]) => (
                  <div key={name} className="border border-gray-200 rounded p-4">
                    <h3 className="font-medium capitalize mb-2">{name.replace('_', ' ')} Endpoint</h3>
                    <code className="text-sm bg-gray-100 p-2 rounded block mb-2">{url}</code>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Test Endpoint →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 text-left"
                >
                  <div className="font-medium">Open Dashboard</div>
                  <div className="text-sm opacity-90">Manage your applications</div>
                </button>
                <button
                  onClick={checkHealth}
                  className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 text-left"
                >
                  <div className="font-medium">Refresh Health Check</div>
                  <div className="text-sm opacity-90">Update system status</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

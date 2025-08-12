'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [credentialId, setCredentialId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [redirectUri, setRedirectUri] = useState('http://localhost:3000/test/callback');
  const [scope, setScope] = useState('profile email');
  const [state, setState] = useState('test_state_' + Math.random().toString(36).substr(2, 9));
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateOAuthUrl = async () => {
    if (!credentialId || !apiKey) {
      alert('Please enter both Credential ID and API Key');
      return;
    }

    setLoading(true);
    try {
      const url = `/api/generate/${credentialId}/${apiKey}/grab/?redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      setResult(data);
      
      if (data.success && data.data.oauth_url) {
        // Auto-open the OAuth URL in a new tab
        window.open(data.data.oauth_url, '_blank');
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setResult(data);
      
      if (data.success && data.data.userId) {
        // Auto-load the credentials for the created user
        setTimeout(() => testApiKeys(data.data.userId), 1000);
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testApiKeys = async (userId?: string) => {
    const testUserId = userId || 'test_user_123';
    setLoading(true);
    try {
      const response = await fetch(`/api/keys/${testUserId}`);
      const data = await response.json();
      setResult(data);
      
      // If we got credentials, auto-populate the form
      if (data.success && data.data.credentials && data.data.credentials.length > 0) {
        const cred = data.data.credentials[0];
        setCredentialId(cred.id);
        setApiKey(cred.apiKey);
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            GLAStudio OAuth API Test Page
          </h1>

          {/* OAuth URL Generator */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              🔗 Generate OAuth URL
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credential ID
                </label>
                <input
                  type="text"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  placeholder="cred_123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gla_abcdef123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redirect URI
                </label>
                <input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scope
                </label>
                <input
                  type="text"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State (Security Parameter)
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={generateOAuthUrl}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate OAuth URL'}
            </button>
          </div>

          {/* API Keys Viewer */}
          <div className="mb-8 p-6 bg-green-50 rounded-lg">
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              🔑 View API Keys
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              View all API credentials for a user (including public/private keys)
            </p>
            <div className="space-y-2">
              <button
                onClick={createTestUser}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
              >
                {loading ? 'Creating...' : 'Create Test User & Credentials'}
              </button>
              <button
                onClick={() => testApiKeys()}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Get API Keys for test_user_123'}
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📋 API Response
              </h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-900 mb-4">
              📚 Quick Setup Instructions
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>1. Fix Firebase:</strong> Run <code className="bg-gray-200 px-2 py-1 rounded">node setup-firebase.js</code></p>
              <p><strong>2. Create API Credentials:</strong> Use <code className="bg-gray-200 px-2 py-1 rounded">POST /api/credentials</code></p>
              <p><strong>3. Get Your Keys:</strong> Use <code className="bg-gray-200 px-2 py-1 rounded">GET /api/keys/[userId]</code></p>
              <p><strong>4. Generate OAuth URLs:</strong> Use the form above or the API endpoint</p>
            </div>
          </div>

          {/* API Endpoint Summary */}
          <div className="mt-8 p-6 bg-purple-50 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">
              🛠️ Available Endpoints
            </h2>
            <div className="space-y-2 text-sm">
              <div><code className="bg-gray-200 px-2 py-1 rounded">GET /api/generate/{'{id}'}/{'{apiKey}'}/grab/</code> - Generate OAuth URL</div>
              <div><code className="bg-gray-200 px-2 py-1 rounded">GET /api/keys/{'{userId}'}</code> - Get user's API keys</div>
              <div><code className="bg-gray-200 px-2 py-1 rounded">POST /api/credentials</code> - Create new credentials</div>
              <div><code className="bg-gray-200 px-2 py-1 rounded">GET /api/oauth/authorize</code> - OAuth authorization</div>
              <div><code className="bg-gray-200 px-2 py-1 rounded">POST /api/oauth/token</code> - Exchange code for token</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface CallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  session_url?: string;
}

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState<CallbackParams>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const extractedParams: CallbackParams = {
      code: searchParams.get('code') || undefined,
      state: searchParams.get('state') || undefined,
      error: searchParams.get('error') || undefined,
      error_description: searchParams.get('error_description') || undefined,
      session_url: searchParams.get('session_url') || undefined,
    };

    setParams(extractedParams);
  }, [searchParams]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasError = params.error;
  const hasCode = params.code;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              OAuth Callback Test Page
            </h1>
            <p className="text-gray-600">
              This page receives the OAuth callback and displays the results
            </p>
          </div>

          {hasError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-semibold text-red-800">Authorization Error</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Error Code</label>
                  <div className="bg-red-100 p-3 rounded border text-red-800 font-mono text-sm">
                    {params.error}
                  </div>
                </div>

                {params.error_description && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Error Description</label>
                    <div className="bg-red-100 p-3 rounded border text-red-800 text-sm">
                      {params.error_description}
                    </div>
                  </div>
                )}

                {params.state && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">State</label>
                    <div className="bg-red-100 p-3 rounded border text-red-800 font-mono text-sm">
                      {params.state}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : hasCode ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-semibold text-green-800">Authorization Successful</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Authorization Code</label>
                  <div className="flex">
                    <div className="bg-green-100 p-3 rounded-l border border-r-0 text-green-800 font-mono text-sm flex-1 break-all">
                      {params.code}
                    </div>
                    <button
                      onClick={() => copyToClipboard(params.code || '')}
                      className="bg-green-600 text-white px-4 py-3 rounded-r hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      title="Copy authorization code"
                    >
                      {copied ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Copy this code and paste it in the test page to exchange for an access token
                  </p>
                </div>

                {params.state && (
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">State Parameter</label>
                    <div className="bg-green-100 p-3 rounded border text-green-800 font-mono text-sm">
                      {params.state}
                    </div>
                  </div>
                )}

                {params.session_url && (
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Session URL</label>
                    <div className="bg-green-100 p-3 rounded border text-green-800 font-mono text-sm break-all">
                      {params.session_url}
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Format: https://auth-GLAstudio.auth/{'{session-id}'}/{'{rotation-id}'}/{'{number-id}'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h2 className="text-xl font-semibold text-yellow-800">No Authorization Data</h2>
              </div>
              <p className="text-yellow-700">
                This page didn't receive any authorization code or error information.
                This could mean the OAuth flow was cancelled or there was an issue with the redirect.
              </p>
            </div>
          )}

          {/* URL Parameters Debug Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Received URL Parameters</h3>
            <div className="bg-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
              <div className="text-gray-600 mb-2">Current URL:</div>
              <div className="text-gray-800 break-all mb-4">{window.location.href}</div>

              <div className="text-gray-600 mb-2">Parsed Parameters:</div>
              <pre className="text-gray-800">
                {JSON.stringify(params, null, 2)}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/test')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              ← Back to Test Console
            </button>

            {hasCode && (
              <button
                onClick={() => {
                  const url = `/test?code=${encodeURIComponent(params.code || '')}&state=${encodeURIComponent(params.state || '')}`;
                  router.push(url);
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Continue OAuth Flow →
            </button>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Next Steps</h3>
            <div className="text-blue-800 space-y-2">
              {hasCode ? (
                <>
                  <p>✅ You have successfully received an authorization code!</p>
                  <p>📋 Copy the authorization code above</p>
                  <p>🔄 Go back to the test console and paste it in Step 2</p>
                  <p>🔑 Exchange the code for an access token</p>
                  <p>👤 Use the access token to get user information</p>
                </>
              ) : hasError ? (
                <>
                  <p>❌ The authorization failed</p>
                  <p>🔍 Check the error details above</p>
                  <p>🔧 Verify your client configuration</p>
                  <p>🔄 Try the authorization flow again</p>
                </>
              ) : (
                <>
                  <p>⚠️ No authorization data received</p>
                  <p>🔄 Go back to the test console</p>
                  <p>🚀 Start a new authorization flow</p>
                  <p>🔧 Check your redirect URI configuration</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface EnvStatus {
  key: string;
  value: string | undefined;
  required: boolean;
  description: string;
  category: string;
}

interface ConfigStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export default function EnvChecker() {
  const [envStatus, setEnvStatus] = useState<EnvStatus[]>([]);
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    isValid: false,
    errors: [],
    warnings: [],
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  const checkEnvironmentVariables = () => {
    const envVars: EnvStatus[] = [
      // Firebase Client Configuration
      {
        key: "NEXT_PUBLIC_FIREBASE_API_KEY",
        value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        required: true,
        description: "Firebase Web API Key",
        category: "Firebase Client",
      },
      {
        key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        required: true,
        description: "Firebase Auth Domain",
        category: "Firebase Client",
      },
      {
        key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        required: true,
        description: "Firebase Project ID",
        category: "Firebase Client",
      },
      {
        key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        required: true,
        description: "Firebase Storage Bucket",
        category: "Firebase Client",
      },
      {
        key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        required: true,
        description: "Firebase Messaging Sender ID",
        category: "Firebase Client",
      },
      {
        key: "NEXT_PUBLIC_FIREBASE_APP_ID",
        value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        required: true,
        description: "Firebase App ID",
        category: "Firebase Client",
      },
      // Firebase Admin Configuration
      {
        key: "FIREBASE_PROJECT_ID",
        value: process.env.FIREBASE_PROJECT_ID,
        required: false,
        description: "Firebase Project ID (Server)",
        category: "Firebase Admin",
      },
      {
        key: "FIREBASE_CLIENT_EMAIL",
        value: process.env.FIREBASE_CLIENT_EMAIL,
        required: false,
        description: "Firebase Service Account Email",
        category: "Firebase Admin",
      },
      {
        key: "FIREBASE_PRIVATE_KEY",
        value: process.env.FIREBASE_PRIVATE_KEY,
        required: false,
        description: "Firebase Private Key",
        category: "Firebase Admin",
      },
      // Session Management
      {
        key: "SESSION_SECRET",
        value: process.env.SESSION_SECRET,
        required: false,
        description: "Server Session Secret",
        category: "Session Management",
      },
      {
        key: "NEXT_PUBLIC_SESSION_SECRET",
        value: process.env.NEXT_PUBLIC_SESSION_SECRET,
        required: false,
        description: "Client Session Secret",
        category: "Session Management",
      },
      // OAuth Configuration
      {
        key: "OAUTH_CLIENT_ID",
        value: process.env.OAUTH_CLIENT_ID,
        required: false,
        description: "OAuth Client ID",
        category: "OAuth",
      },
      {
        key: "OAUTH_CLIENT_SECRET",
        value: process.env.OAUTH_CLIENT_SECRET,
        required: false,
        description: "OAuth Client Secret",
        category: "OAuth",
      },
    ];

    setEnvStatus(envVars);
    validateConfiguration(envVars);
  };

  const validateConfiguration = (envVars: EnvStatus[]) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required Firebase variables
    const requiredFirebase = envVars.filter(
      (env) => env.category === "Firebase Client" && env.required,
    );
    const missingFirebase = requiredFirebase.filter((env) => !env.value);

    if (missingFirebase.length > 0) {
      errors.push(
        `Missing required Firebase configuration: ${missingFirebase.map((env) => env.key).join(", ")}`,
      );
    }

    // Check session secrets
    const sessionSecrets = envVars.filter(
      (env) => env.category === "Session Management",
    );
    const missingSecrets = sessionSecrets.filter((env) => !env.value);

    if (missingSecrets.length > 0) {
      warnings.push(
        "Session secrets not configured. Using default values (not recommended for production).",
      );
    }

    // Check if using default secrets
    const sessionSecret = envVars.find((env) => env.key === "SESSION_SECRET");
    const publicSecret = envVars.find(
      (env) => env.key === "NEXT_PUBLIC_SESSION_SECRET",
    );

    if (
      sessionSecret?.value?.includes("default") ||
      publicSecret?.value?.includes("default")
    ) {
      warnings.push(
        "Using default session secrets. Please generate secure secrets for production.",
      );
    }

    // Check Firebase Admin configuration
    const adminVars = envVars.filter((env) => env.category === "Firebase Admin");
    const missingAdmin = adminVars.filter((env) => !env.value);

    if (missingAdmin.length > 0) {
      warnings.push(
        "Firebase Admin SDK not configured. Some server-side features may not work.",
      );
    }

    setConfigStatus({
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  };

  const getStatusIcon = (env: EnvStatus) => {
    if (env.value) {
      return <span className="text-green-500 text-xl">✓</span>;
    } else if (env.required) {
      return <span className="text-red-500 text-xl">✗</span>;
    } else {
      return <span className="text-yellow-500 text-xl">⚠</span>;
    }
  };

  const getStatusText = (env: EnvStatus) => {
    if (env.value) {
      return "Set";
    } else if (env.required) {
      return "Missing (Required)";
    } else {
      return "Missing (Optional)";
    }
  };

  const getMaskedValue = (env: EnvStatus) => {
    if (!env.value) return "Not set";
    if (env.key.includes("SECRET") || env.key.includes("PRIVATE_KEY")) {
      return `${env.value.substring(0, 8)}...`;
    }
    return env.value;
  };

  const groupedEnvVars = envStatus.reduce(
    (acc, env) => {
      if (!acc[env.category]) {
        acc[env.category] = [];
      }
      acc[env.category].push(env);
      return acc;
    },
    {} as Record<string, EnvStatus[]>,
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Environment Configuration Status
        </h2>
        <p className="text-gray-600">
          Check your environment variables and configuration setup
        </p>
      </div>

      {/* Overall Status */}
      <div
        className={`p-4 rounded-lg mb-6 ${
          configStatus.isValid
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {configStatus.isValid ? (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            ) : (
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✗</span>
              </div>
            )}
          </div>
          <div className="ml-3">
            <h3
              className={`text-sm font-medium ${
                configStatus.isValid ? "text-green-800" : "text-red-800"
              }`}
            >
              {configStatus.isValid
                ? "Configuration Valid"
                : "Configuration Issues Detected"}
            </h3>
            <p
              className={`text-sm ${
                configStatus.isValid ? "text-green-700" : "text-red-700"
              }`}
            >
              {configStatus.isValid
                ? "All required environment variables are configured"
                : "Please fix the issues below to continue"}
            </p>
          </div>
        </div>
      </div>

      {/* Errors */}
      {configStatus.errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {configStatus.errors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {configStatus.warnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {configStatus.warnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toggle Details */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showDetails ? "Hide" : "Show"} Configuration Details
        </button>
      </div>

      {/* Configuration Details */}
      {showDetails && (
        <div className="space-y-6">
          {Object.entries(groupedEnvVars).map(([category, vars]) => (
            <div key={category} className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">{category}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {vars.map((env) => (
                  <div key={env.key} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(env)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {env.key}
                          </div>
                          <div className="text-xs text-gray-500">
                            {env.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm ${
                            env.value
                              ? "text-green-600"
                              : env.required
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {getStatusText(env)}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {getMaskedValue(env)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup Instructions */}
      {!configStatus.isValid && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Quick Setup Guide:
          </h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Create a `.env.local` file in your project root</li>
            <li>
              Copy the Firebase configuration from your Firebase project settings
            </li>
            <li>Add all required environment variables to the file</li>
            <li>Restart your development server</li>
            <li>Refresh this page to check the status</li>
          </ol>
          <div className="mt-3">
            <a
              href="/FIREBASE_SETUP.md"
              target="_blank"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              📖 View Complete Setup Guide
            </a>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={checkEnvironmentVariables}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Refresh Configuration Check
        </button>
      </div>
    </div>
  );
}

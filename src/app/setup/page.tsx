"use client";

import { useState, useEffect } from "react";
import EnvChecker from "@/components/EnvChecker";

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      id: 1,
      title: "Create Firebase Project",
      description: "Set up a new Firebase project with Authentication and Firestore",
      icon: "🔥",
      tasks: [
        "Go to Firebase Console",
        "Create new project",
        "Enable Authentication",
        "Create Firestore database",
      ],
    },
    {
      id: 2,
      title: "Configure Authentication",
      description: "Enable Google OAuth and Email/Password authentication",
      icon: "🔐",
      tasks: [
        "Enable Email/Password sign-in",
        "Enable Google sign-in",
        "Add authorized domains",
        "Configure OAuth consent screen",
      ],
    },
    {
      id: 3,
      title: "Get Configuration Keys",
      description: "Extract Firebase configuration and create environment file",
      icon: "🔑",
      tasks: [
        "Copy Firebase web app config",
        "Generate service account key",
        "Create .env.local file",
        "Add all environment variables",
      ],
    },
    {
      id: 4,
      title: "Test Configuration",
      description: "Verify that all environment variables are set correctly",
      icon: "✅",
      tasks: [
        "Check environment variables",
        "Test Firebase connection",
        "Verify authentication works",
        "Test database access",
      ],
    },
  ];

  const markStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const isStepComplete = (stepId: number) => {
    return completedSteps.includes(stepId);
  };

  const getStepStatus = (stepId: number) => {
    if (isStepComplete(stepId)) {
      return "complete";
    } else if (stepId === currentStep) {
      return "current";
    } else if (stepId < currentStep) {
      return "incomplete";
    } else {
      return "upcoming";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                GLAStudio OAuth Setup
              </h1>
              <p className="mt-2 text-gray-600">
                Complete these steps to configure your OAuth authentication system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                ← Back to Home
              </a>
              <a
                href="/FIREBASE_SETUP.md"
                target="_blank"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                📖 Full Setup Guide
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Setup Steps */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Setup Progress
              </h2>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{completedSteps.length} of {steps.length} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(completedSteps.length / steps.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const status = getStepStatus(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`border rounded-lg p-6 transition-all duration-200 ${
                        status === "current"
                          ? "border-blue-500 bg-blue-50"
                          : status === "complete"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            status === "complete"
                              ? "bg-green-500 text-white"
                              : status === "current"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {status === "complete" ? "✓" : step.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`text-lg font-medium ${
                                status === "complete"
                                  ? "text-green-800"
                                  : status === "current"
                                    ? "text-blue-800"
                                    : "text-gray-900"
                              }`}
                            >
                              Step {step.id}: {step.title}
                            </h3>
                            {status === "complete" && (
                              <span className="text-green-600 text-sm font-medium">
                                Completed
                              </span>
                            )}
                          </div>
                          <p
                            className={`mt-1 text-sm ${
                              status === "complete"
                                ? "text-green-700"
                                : status === "current"
                                  ? "text-blue-700"
                                  : "text-gray-600"
                            }`}
                          >
                            {step.description}
                          </p>

                          {/* Task List */}
                          <ul className="mt-3 space-y-1">
                            {step.tasks.map((task, taskIndex) => (
                              <li
                                key={taskIndex}
                                className={`text-sm flex items-center ${
                                  status === "complete"
                                    ? "text-green-600"
                                    : status === "current"
                                      ? "text-blue-600"
                                      : "text-gray-500"
                                }`}
                              >
                                <span className="mr-2">
                                  {status === "complete" ? "✓" : "•"}
                                </span>
                                {task}
                              </li>
                            ))}
                          </ul>

                          {/* Action Buttons */}
                          <div className="mt-4 flex space-x-3">
                            {status === "current" && !isStepComplete(step.id) && (
                              <button
                                onClick={() => markStepComplete(step.id)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                              >
                                Mark as Complete
                              </button>
                            )}
                            {status !== "complete" && (
                              <button
                                onClick={() => setCurrentStep(step.id)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-2xl mr-3">🔥</span>
                  <div>
                    <div className="font-medium text-gray-900">Firebase Console</div>
                    <div className="text-sm text-gray-500">Manage your Firebase project</div>
                  </div>
                </a>
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-2xl mr-3">☁️</span>
                  <div>
                    <div className="font-medium text-gray-900">Google Cloud Console</div>
                    <div className="text-sm text-gray-500">Configure OAuth settings</div>
                  </div>
                </a>
                <a
                  href="/auth/login"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-2xl mr-3">🔐</span>
                  <div>
                    <div className="font-medium text-gray-900">Test Authentication</div>
                    <div className="text-sm text-gray-500">Try the login flow</div>
                  </div>
                </a>
                <a
                  href="/api/health"
                  target="_blank"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-2xl mr-3">⚡</span>
                  <div>
                    <div className="font-medium text-gray-900">Health Check</div>
                    <div className="text-sm text-gray-500">Verify system status</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Environment Checker */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <EnvChecker />
            </div>
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Common Issues & Solutions
          </h3>
          <div className="space-y-4">
            <div className="border-l-4 border-red-400 pl-4">
              <h4 className="font-medium text-red-800">
                Firebase: Error (auth/configuration-not-found)
              </h4>
              <p className="text-sm text-red-700 mt-1">
                This means your Firebase environment variables are missing. Check that your
                <code className="bg-red-100 px-1 rounded">.env.local</code> file exists and
                contains all required Firebase configuration values.
              </p>
            </div>
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-yellow-800">
                Auth domain not authorized
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Add <code className="bg-yellow-100 px-1 rounded">localhost</code> to your
                Firebase Authentication authorized domains in the Firebase console.
              </p>
            </div>
            <div className="border-l-4 border-blue-400 pl-4">
              <h4 className="font-medium text-blue-800">
                Google OAuth not working
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Ensure you've configured OAuth consent screen in Google Cloud Console and
                added the correct redirect URIs.
              </p>
            </div>
          </div>
        </div>

        {/* Environment File Template */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Environment File Template
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in
            your project root with these variables:
          </p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration (Optional - for server-side features)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"

# Session Management (Optional - will use defaults if not set)
SESSION_SECRET=your-super-secret-session-key-here
NEXT_PUBLIC_SESSION_SECRET=your-public-session-key-here

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000`}
            </pre>
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration (Optional - for server-side features)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"

# Session Management (Optional - will use defaults if not set)
SESSION_SECRET=your-super-secret-session-key-here
NEXT_PUBLIC_SESSION_SECRET=your-public-session-key-here

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000`);
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-200"
            >
              📋 Copy Template
            </button>
            <span className="text-sm text-gray-500">
              Copy this template and replace the values with your actual configuration
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

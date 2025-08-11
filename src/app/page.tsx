"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [configurationStatus, setConfigurationStatus] = useState<{
    isValid: boolean;
    missingVars: string[];
  }>({ isValid: true, missingVars: [] });
  const router = useRouter();

  useEffect(() => {
    // Check if Firebase configuration is complete
    const requiredVars = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    setConfigurationStatus({
      isValid: missing.length === 0,
      missingVars: missing,
    });
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const features = [
    {
      icon: "🔐",
      title: "Secure by Default",
      description:
        "Enterprise-grade security with OAuth 2.0 and OpenID Connect standards. Built-in protection against common vulnerabilities.",
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description:
        "Sub-100ms response times globally. CDN-powered with 99.9% uptime SLA.",
    },
    {
      icon: "🛠️",
      title: "Developer Friendly",
      description:
        "Simple REST APIs, comprehensive documentation, and SDKs for popular languages.",
    },
    {
      icon: "📊",
      title: "Analytics & Monitoring",
      description:
        "Real-time dashboards, usage analytics, and rate limiting with detailed insights.",
    },
    {
      icon: "🌐",
      title: "Global Scale",
      description:
        "Built to handle millions of users with automatic scaling and global distribution.",
    },
    {
      icon: "🔧",
      title: "Easy Integration",
      description:
        "Drop-in replacement for existing auth systems. Migrate in minutes, not months.",
    },
  ];

  const stats = [
    { value: "10M+", label: "API Calls/Month" },
    { value: "99.9%", label: "Uptime" },
    { value: "500+", label: "Developers" },
    { value: "<100ms", label: "Response Time" },
  ];

  return (
    <div className="bg-white">
      {/* Configuration Warning Banner */}
      {!configurationStatus.isValid && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Configuration Required
                  </h3>
                  <p className="text-sm text-red-700">
                    Firebase environment variables are missing. Please complete
                    the setup to enable authentication.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleNavigation("/setup")}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                >
                  Complete Setup
                </button>
                <button
                  onClick={() =>
                    setConfigurationStatus({ isValid: true, missingVars: [] })
                  }
                  className="text-red-600 hover:text-red-800 transition-colors duration-200"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              OAuth Authentication
              <span className="block text-blue-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Secure, scalable authentication for your applications. Just like
              Google OAuth, but designed for modern developers who need speed,
              simplicity, and reliability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleNavigation("/auth/login")}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer transform"
              >
                Get Started Free
              </button>
              <button
                onClick={() => handleNavigation("/docs")}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer transform"
              >
                View Documentation
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How GLAStudio OAuth Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple URL-based authentication that returns structured session
              URLs for easy integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                <span className="text-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Redirect to GLAStudio
              </h3>
              <p className="text-gray-600 mb-4">
                Send users to our OAuth endpoint with your client credentials.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                https://auth-GLAstudio.auth/api/authorize
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                <span className="text-blue-600 font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                User Authenticates
              </h3>
              <p className="text-gray-600 mb-4">
                Users sign in with Google or email/password on our secure
                platform.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                🔐 Secure login interface
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                <span className="text-blue-600 font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Get Session URL
              </h3>
              <p className="text-gray-600 mb-4">
                Receive a structured URL with session data for your application.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono text-xs">
                https://auth-GLAstudio.auth/{"{session-id}"}/{"{rotation-id}"}/
                {"{login-number}"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Build Secure Apps
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From authentication to user management, we provide all the tools
              you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg border hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Integration in Minutes
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Get started with just a few lines of code. Here's how simple it
              is.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* JavaScript Example */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-700 flex justify-between items-center">
                <h3 className="text-white font-semibold">JavaScript</h3>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `// Redirect to GLAStudio OAuth
const authUrl = 'https://auth-GLAstudio.auth/api/authorize?' +
  new URLSearchParams({
    client_id: 'your_client_id',
    redirect_uri: 'https://yourapp.com/callback',
    response_type: 'code',
    scope: 'openid profile email',
    state: 'random_state_string'
  });

window.location.href = authUrl;

// Handle callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Exchange code for tokens
const response = await fetch('https://auth-GLAstudio.auth/api/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret',
    code: code,
    redirect_uri: 'https://yourapp.com/callback'
  })
});

const tokens = await response.json();`,
                      "js",
                    )
                  }
                  className={`text-xs px-3 py-1 rounded ${
                    copiedCode === "js"
                      ? "bg-green-600 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
                >
                  {copiedCode === "js" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-6">
                <pre className="text-green-400 text-sm overflow-x-auto">
                  {`// Redirect to GLAStudio OAuth
const authUrl = 'https://auth-GLAstudio.auth/api/authorize?' +
  new URLSearchParams({
    client_id: 'your_client_id',
    redirect_uri: 'https://yourapp.com/callback',
    response_type: 'code',
    scope: 'openid profile email',
    state: 'random_state_string'
  });

window.location.href = authUrl;

// Handle callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Exchange code for tokens
const response = await fetch('https://auth-GLAstudio.auth/api/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret',
    code: code,
    redirect_uri: 'https://yourapp.com/callback'
  })
});

const tokens = await response.json();`}
                </pre>
              </div>
            </div>

            {/* Python Example */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-700 flex justify-between items-center">
                <h3 className="text-white font-semibold">Python</h3>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `import requests
from urllib.parse import urlencode

# Redirect to GLAStudio OAuth
auth_params = {
    'client_id': 'your_client_id',
    'redirect_uri': 'https://yourapp.com/callback',
    'response_type': 'code',
    'scope': 'openid profile email',
    'state': 'random_state_string'
}

auth_url = f"https://auth-GLAstudio.auth/api/authorize?{urlencode(auth_params)}"
# Redirect user to auth_url

# Exchange code for tokens
def exchange_code_for_tokens(code):
    token_data = {
        'grant_type': 'authorization_code',
        'client_id': 'your_client_id',
        'client_secret': 'your_client_secret',
        'code': code,
        'redirect_uri': 'https://yourapp.com/callback'
    }

    response = requests.post(
        'https://auth-GLAstudio.auth/api/token',
        json=token_data
    )

    return response.json()

tokens = exchange_code_for_tokens(authorization_code)`,
                      "python",
                    )
                  }
                  className={`text-xs px-3 py-1 rounded ${
                    copiedCode === "python"
                      ? "bg-green-600 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
                >
                  {copiedCode === "python" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-6">
                <pre className="text-green-400 text-sm overflow-x-auto">
                  {`import requests
from urllib.parse import urlencode

# Redirect to GLAStudio OAuth
auth_params = {
    'client_id': 'your_client_id',
    'redirect_uri': 'https://yourapp.com/callback',
    'response_type': 'code',
    'scope': 'openid profile email',
    'state': 'random_state_string'
}

auth_url = f"https://auth-GLAstudio.auth/api/authorize?{urlencode(auth_params)}"
# Redirect user to auth_url

# Exchange code for tokens
def exchange_code_for_tokens(code):
    token_data = {
        'grant_type': 'authorization_code',
        'client_id': 'your_client_id',
        'client_secret': 'your_client_secret',
        'code': code,
        'redirect_uri': 'https://yourapp.com/callback'
    }

    response = requests.post(
        'https://auth-GLAstudio.auth/api/token',
        json=token_data
    )

    return response.json()

tokens = exchange_code_for_tokens(authorization_code)`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who trust GLAStudio OAuth for their
            authentication needs. Start building today with our free tier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleNavigation("/auth/login")}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer transform"
            >
              Create Free Account
            </button>
            <button
              onClick={() => handleNavigation("/contact")}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer transform"
            >
              Talk to Sales
            </button>
          </div>

          <div className="mt-8 text-blue-100 text-sm">
            Free tier includes 10,000 monthly active users • No credit card
            required
          </div>
        </div>
      </div>

      {/* Testimonials/Social Proof */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Developers Worldwide
            </h2>
            <p className="text-lg text-gray-600">
              See what developers are saying about GLAStudio OAuth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">JD</span>
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">
                    John Developer
                  </div>
                  <div className="text-sm text-gray-500">
                    Full Stack Engineer
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "GLAStudio OAuth saved us weeks of development time. The API is
                intuitive and the documentation is excellent. Highly
                recommended!"
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">SM</span>
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">
                    Sarah Miller
                  </div>
                  <div className="text-sm text-gray-500">CTO at StartupCo</div>
                </div>
              </div>
              <p className="text-gray-600">
                "Security is paramount for us, and GLAStudio OAuth delivers. The
                rate limiting and analytics features are fantastic."
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">MC</span>
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">Mike Chen</div>
                  <div className="text-sm text-gray-500">Lead Developer</div>
                </div>
              </div>
              <p className="text-gray-600">
                "Migration from our old auth system was seamless. The team
                support was incredible throughout the process."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

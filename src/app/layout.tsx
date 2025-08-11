"use client";

import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const handleSignIn = () => {
    router.push("/auth/login");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <title>GLAStudio OAuth - Developer Authentication Platform</title>
        <meta
          name="description"
          content="Secure OAuth 2.0 authentication service for developers. Fast, reliable, and easy to integrate."
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <div className="min-h-full">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  {/* Logo */}
                  <div
                    className="flex-shrink-0 flex items-center cursor-pointer"
                    onClick={() => handleNavigation("/")}
                  >
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">G</span>
                    </div>
                    <div className="ml-3">
                      <h1 className="text-xl font-semibold text-gray-900">
                        GLAStudio
                      </h1>
                      <p className="text-xs text-gray-500">OAuth Platform</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                  <button
                    onClick={() => handleNavigation("/dashboard")}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation("/docs")}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Documentation
                  </button>
                  <button
                    onClick={() => handleNavigation("/support")}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Support
                  </button>
                </div>

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <div className="hidden md:block">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700">
                        Welcome back!
                      </span>
                      <button
                        type="button"
                        onClick={handleSignIn}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>

                  {/* Mobile menu button */}
                  <div className="md:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="text-gray-700 hover:text-blue-600 p-2"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile menu */}
              {mobileMenuOpen && (
                <div className="md:hidden">
                  <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
                    <button
                      onClick={() => {
                        handleNavigation("/dashboard");
                        setMobileMenuOpen(false);
                      }}
                      className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        handleNavigation("/docs");
                        setMobileMenuOpen(false);
                      }}
                      className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                    >
                      Documentation
                    </button>
                    <button
                      onClick={() => {
                        handleNavigation("/support");
                        setMobileMenuOpen(false);
                      }}
                      className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                    >
                      Support
                    </button>
                    <button
                      onClick={() => {
                        handleSignIn();
                        setMobileMenuOpen(false);
                      }}
                      className="bg-blue-600 text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left hover:bg-blue-700"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">G</span>
                    </div>
                    <div className="ml-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        GLAStudio OAuth
                      </h2>
                      <p className="text-sm text-gray-500">
                        Secure authentication for developers
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-600 max-w-md">
                    Build faster with our OAuth 2.0 authentication platform.
                    Secure, scalable, and developer-friendly API that handles
                    user authentication so you can focus on building great
                    products.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Platform
                  </h3>
                  <ul className="mt-4 space-y-2">
                    <li>
                      <button
                        onClick={() => handleNavigation("/dashboard")}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Dashboard
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavigation("/docs")}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Documentation
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavigation("/pricing")}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Pricing
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavigation("/status")}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Status
                      </button>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Support
                  </h3>
                  <ul className="mt-4 space-y-2">
                    <li>
                      <button
                        onClick={() => handleNavigation("/support")}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Help Center
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavigation("/contact")}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Contact Us
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavigation("/privacy")}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNavigation("/terms")}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        Terms of Service
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-sm text-gray-500">
                    © 2024 GLAStudio OAuth. All rights reserved.
                  </p>
                  <div className="flex space-x-6 mt-4 md:mt-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                      All systems operational
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

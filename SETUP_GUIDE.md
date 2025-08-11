# GLAStudio OAuth System - Complete Setup Guide

This guide will help you complete the setup of your custom OAuth system using NextJS and Firebase Firestore.

## 🚀 Quick Start Overview

This OAuth system provides:
- Custom OAuth 2.0 server with PKCE support
- User authentication via Google and Email/Password
- Developer dashboard for API management
- Rate limiting and security logging
- Session URL format: `https://auth-GLAstudio.auth/{session-id}/{rotation-id}/{number-id}`

## 📋 Prerequisites

- Node.js 18+ installed
- Firebase project created (`itdiary-ase`)
- Google Cloud Console access for OAuth setup
- Basic understanding of OAuth 2.0 flow

## 🔧 Step 1: Environment Configuration

### 1.1 Create Environment File

Copy the example environment file:
```bash
cp .env.example .env.local
```

### 1.2 Configure Basic Settings

Update `.env.local` with your basic configuration:

```env
# Application Configuration
NODE_ENV=development
APP_URL=http://localhost:3000
APP_DOMAIN=localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Generate secure secrets
JWT_SECRET=your-generated-32-character-secret
NEXTAUTH_SECRET=your-generated-nextauth-secret
ENCRYPTION_KEY=your-exactly-32-character-key123
```

**Generate secure secrets:**
```bash
# For JWT_SECRET and NEXTAUTH_SECRET
openssl rand -base64 32

# For ENCRYPTION_KEY (must be exactly 32 characters)
openssl rand -hex 16
```

## 🔥 Step 2: Firebase Configuration

### 2.1 Firebase Client Configuration (Already Provided)

Your Firebase client configuration is already set in the environment:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDAupXvxYn4UQQmqPxUQGYwQ551N20ILpk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=itdiary-ase.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=itdiary-ase
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=itdiary-ase.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
```

### 2.2 Firebase Admin SDK Setup (CRITICAL)

**You need to generate and configure Firebase Admin SDK credentials:**

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: `itdiary-ase`

2. **Navigate to Project Settings:**
   - Click the gear icon ⚙️ → Project Settings
   - Go to "Service accounts" tab

3. **Generate Private Key:**
   - Click "Generate new private key"
   - Download the JSON file
   - **Keep this file secure and never commit it to version control!**

4. **Extract Credentials from JSON:**
   From the downloaded JSON file, extract these values:
   ```json
   {
     "project_id": "itdiary-ase",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@itdiary-ase.iam.gserviceaccount.com"
   }
   ```

5. **Update .env.local:**
   ```env
   FIREBASE_PROJECT_ID=itdiary-ase
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@itdiary-ase.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
   ```

   **⚠️ Important:** The private key must be wrapped in quotes and newlines should be literal `\n`

### 2.3 Configure Firestore Database

1. **Enable Firestore:**
   - In Firebase Console → Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select your preferred region

2. **Set up Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // API credentials - only the owner can access
       match /api_credentials/{credentialId} {
         allow read, write: if request.auth != null && 
           request.auth.uid == resource.data.userId;
       }
       
       // OAuth sessions - server-side only
       match /oauth_sessions/{sessionId} {
         allow read, write: if false; // Server-side only
       }
       
       // Usage stats - read only for owners
       match /usage_stats/{statsId} {
         allow read: if request.auth != null;
         allow write: if false; // Server-side only
       }
       
       // Security logs - admin only
       match /security_logs/{logId} {
         allow read, write: if false; // Server-side only
       }
     }
   }
   ```

### 2.4 Enable Authentication

1. **Go to Authentication section:**
   - Firebase Console → Authentication
   - Click "Get started"

2. **Enable Google Sign-in:**
   - Go to "Sign-in method" tab
   - Click "Google"
   - Enable it
   - Add your project's support email

3. **Enable Email/Password (optional):**
   - Click "Email/Password"
   - Enable it

## 🌐 Step 3: Google OAuth Configuration

### 3.1 Google Cloud Console Setup

1. **Visit Google Cloud Console:**
   - Go to: https://console.cloud.google.com/
   - Select your project or create a new one

2. **Enable APIs:**
   - Navigate to "APIs & Services" → "Library"
   - Search for and enable:
     - Google Identity Toolkit API
     - Cloud Firestore API

3. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" for testing
   - Fill in required information:
     - App name: "GLAStudio OAuth"
     - User support email: your email
     - Developer contact: your email

4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "GLAStudio OAuth Web Client"
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     http://localhost:3000/auth/callback
     https://your-tunnel-domain.ngrok.io/api/auth/callback/google
     https://your-tunnel-domain.ngrok.io/auth/callback
     ```

## 🔌 Step 4: Development Setup with Tunneling

For OAuth callbacks to work, you need a public URL. Use one of these tunneling solutions:

### 4.1 Option A: Ngrok (Recommended)

1. **Install Ngrok:**
   ```bash
   # macOS
   brew install ngrok

   # Windows
   choco install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Setup Ngrok:**
   ```bash
   # Sign up at https://ngrok.com and get your authtoken
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

3. **Start Development Server:**
   ```bash
   # Terminal 1: Start Next.js
   npm run dev

   # Terminal 2: Start tunnel
   ngrok http 3000
   ```

4. **Update Environment:**
   ```env
   APP_URL=https://your-tunnel-id.ngrok.io
   APP_DOMAIN=your-tunnel-id.ngrok.io
   NEXTAUTH_URL=https://your-tunnel-id.ngrok.io
   TUNNEL_DOMAIN=your-tunnel-id.ngrok.io
   ```

### 4.2 Option B: Cloudflare Tunnel

```bash
# Quick tunnel (no setup required)
cloudflared tunnel --url http://localhost:3000
```

### 4.3 Update Firebase Authorized Domains

1. **Go to Firebase Console:**
   - Authentication → Settings → Authorized domains
   - Add your tunnel domain: `your-tunnel-id.ngrok.io`

2. **Update Google OAuth:**
   - Add tunnel URLs to authorized redirect URIs in Google Cloud Console

## 🚀 Step 5: Install Dependencies and Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

3. **Verify Setup:**
   - Visit: `http://localhost:3000`
   - Check browser console for any Firebase errors
   - Try the "Sign in with Google" functionality

## 🧪 Step 6: Testing the OAuth Flow

### 6.1 Create Test Application

1. **Access Dashboard:**
   - Go to: `https://your-tunnel-domain.ngrok.io/dashboard`
   - Sign in with Google

2. **Create API Credentials:**
   - Click "Create New Application"
   - Fill in details:
     - Name: "Test App"
     - Description: "Testing OAuth flow"
     - Redirect URIs: `https://your-tunnel-domain.ngrok.io/auth/callback`
     - Scopes: `profile`, `email`

3. **Note the Generated Values:**
   - Client ID (e.g., `gla_abc123...`)
   - Client Secret
   - API Key

### 6.2 Test Authorization Flow

1. **Start Authorization:**
   ```
   https://your-tunnel-domain.ngrok.io/api/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=https://your-tunnel-domain.ngrok.io/auth/callback&scope=profile email&state=test123
   ```

2. **Expected Flow:**
   - Redirects to login page
   - User signs in with Google
   - Redirects to authorization page
   - User grants permission
   - Redirects back with authorization code
   - Session URL is generated: `https://auth-GLAstudio.auth/{session-id}/{rotation-id}/{number-id}`

3. **Exchange Code for Token:**
   ```bash
   curl -X POST https://your-tunnel-domain.ngrok.io/api/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code&code=YOUR_AUTH_CODE&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://your-tunnel-domain.ngrok.io/auth/callback"
   ```

4. **Get User Info:**
   ```bash
   curl -X GET https://your-tunnel-domain.ngrok.io/api/oauth/userinfo \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## 🎯 Step 7: API Endpoints Reference

Your OAuth system exposes these endpoints:

### Authorization Endpoint
```
GET/POST /api/oauth/authorize
```
Parameters:
- `response_type=code`
- `client_id` (required)
- `redirect_uri` (required)
- `scope` (required)
- `state` (recommended)
- `code_challenge` (optional, for PKCE)
- `code_challenge_method` (S256 or plain)

### Token Endpoint
```
POST /api/oauth/token
```
Parameters:
- `grant_type=authorization_code`
- `code` (required)
- `client_id` (required)
- `client_secret` (required)
- `redirect_uri` (required)
- `code_verifier` (if using PKCE)

### User Info Endpoint
```
GET /api/oauth/userinfo
```
Headers:
- `Authorization: Bearer {access_token}`

### Session URL Format
```
https://auth-GLAstudio.auth/{session-id}/{rotation-id}/{number-id}
```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Admin SDK Error:**
   ```
   Failed to initialize Firebase Admin SDK
   ```
   **Solution:** Check your `FIREBASE_PRIVATE_KEY` is properly formatted with literal `\n` characters.

2. **Google Sign-in Not Working:**
   ```
   redirect_uri_mismatch
   ```
   **Solution:** Ensure your tunnel domain is added to Google OAuth authorized redirect URIs.

3. **CORS Errors:**
   ```
   Access to fetch at 'https://...' has been blocked by CORS policy
   ```
   **Solution:** Add your tunnel domain to Firebase authorized domains.

4. **Rate Limiting Issues:**
   ```
   Rate limit exceeded
   ```
   **Solution:** Set `SKIP_RATE_LIMIT=true` in development or increase limits.

### Debug Tools

1. **Check Firebase Connection:**
   ```bash
   # In browser console at http://localhost:3000
   console.log(firebase.apps.length); // Should be > 0
   ```

2. **Check Ngrok Dashboard:**
   - Visit: `http://localhost:4040`
   - Monitor incoming requests

3. **Check Application Logs:**
   ```bash
   # In terminal running npm run dev
   # Look for Firebase initialization messages
   ```

### Environment Verification

Create this test endpoint to verify your setup:

**File: `src/app/api/health/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    firebase: {
      admin_db: !!adminDb,
      admin_auth: !!adminAuth,
    },
    environment: {
      node_env: process.env.NODE_ENV,
      app_url: process.env.APP_URL,
      firebase_project: process.env.FIREBASE_PROJECT_ID,
    }
  };

  return NextResponse.json(health);
}
```

Visit `/api/health` to check your configuration.

## 🚀 Production Deployment

When ready for production:

1. **Update Environment Variables:**
   ```env
   NODE_ENV=production
   APP_URL=https://auth-glasstudio.auth
   APP_DOMAIN=auth-glasstudio.auth
   ```

2. **Deploy to Vercel/Netlify:**
   ```bash
   # Vercel
   vercel deploy

   # Or build for other platforms
   npm run build
   ```

3. **Update OAuth Providers:**
   - Add production URLs to Google OAuth
   - Update Firebase authorized domains
   - Update redirect URIs in your applications

## 📚 Next Steps

- [ ] Complete Firebase Admin SDK setup
- [ ] Test OAuth flow end-to-end
- [ ] Create your first API application
- [ ] Set up monitoring and logging
- [ ] Configure production deployment
- [ ] Add webhook support (optional)
- [ ] Implement additional OAuth scopes

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Test Firebase connection with `/api/health`
4. Check ngrok dashboard for request logs
5. Review Firebase Console for authentication events

For additional support, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**🎉 Congratulations!** You now have a fully functional OAuth 2.0 server with custom session URLs and developer dashboard.
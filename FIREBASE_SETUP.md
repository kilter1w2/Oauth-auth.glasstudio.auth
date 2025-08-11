# Firebase Setup Guide for GLAStudio OAuth

This guide will walk you through setting up Firebase for the GLAStudio OAuth authentication system.

## 🚀 Quick Setup

### Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project"
   - Enter project name: `glasstudio-oauth` (or your preferred name)
   - Accept terms and click "Continue"
   - Disable Google Analytics (optional)
   - Click "Create project"

### Step 2: Set Up Authentication

1. **Enable Authentication**
   - In the Firebase console, click "Authentication" in the left sidebar
   - Click "Get started"

2. **Configure Sign-in Methods**
   - Go to "Sign-in method" tab
   - Enable "Email/Password"
     - Click on "Email/Password"
     - Toggle "Enable" to ON
     - Click "Save"
   
   - Enable "Google"
     - Click on "Google"
     - Toggle "Enable" to ON
     - Enter your project's support email
     - Click "Save"

3. **Add Authorized Domains**
   - In "Sign-in method" tab, scroll down to "Authorized domains"
   - Add your domains:
     - `localhost` (for development)
     - `your-production-domain.com` (for production)

### Step 3: Set Up Firestore Database

1. **Create Firestore Database**
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (we'll add security rules later)
   - Select a location close to your users
   - Click "Done"

2. **Set Up Collections**
   The app will automatically create collections, but you can pre-create them:
   - `users` - User profiles
   - `api_credentials` - OAuth applications
   - `oauth_sessions` - Active sessions
   - `usage_stats` - API usage statistics

### Step 4: Get Configuration Keys

1. **Get Web App Configuration**
   - Click the gear icon (Project settings) in the left sidebar
   - Scroll down to "Your apps" section
   - Click "Add app" → Web app icon `</>`
   - Enter app nickname: `glasstudio-oauth-web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration**
   - Copy the `firebaseConfig` object
   - You'll need these values for your environment variables

### Step 5: Create Environment File

1. **Create `.env.local` file**
   - In your project root, create `.env.local`
   - Add the following variables:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration (for server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Session Management
SESSION_SECRET=your-super-secret-session-key-here
NEXT_PUBLIC_SESSION_SECRET=your-public-session-key-here

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

### Step 6: Get Firebase Admin SDK Key

1. **Generate Service Account Key**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Extract Required Values**
   From the downloaded JSON, extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n characters)

### Step 7: Configure Google OAuth

1. **Set Up Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project
   - Enable "Google+ API" (if not already enabled)

2. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in required information:
     - App name: `GLAStudio OAuth`
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: `GLAStudio OAuth Web Client`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)
   - Copy Client ID and Client Secret

### Step 8: Security Rules

1. **Set Firestore Security Rules**
   - Go to Firestore Database → Rules
   - Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // API credentials - owner only
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

2. **Set Authentication Rules**
   - Go to Authentication → Settings
   - Set password policy (minimum 6 characters)
   - Configure user account management

## 🔧 Testing Your Setup

### 1. Test Firebase Connection

Create a test file `test-firebase.js`:

```javascript
import { auth, db } from './src/lib/firebase-client.js';

console.log('Firebase Auth:', auth);
console.log('Firestore:', db);
console.log('Test completed successfully!');
```

Run: `node test-firebase.js`

### 2. Test Authentication

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/auth/login`
3. Try signing up with email/password
4. Try signing in with Google

### 3. Verify Firestore

1. Go to Firestore console
2. Check if `users` collection is created after signup
3. Verify user data is stored correctly

## 🚨 Troubleshooting

### Common Issues

#### 1. "Firebase: Error (auth/configuration-not-found)"
**Solution:**
- Verify all environment variables are set correctly
- Check that `.env.local` file exists in project root
- Restart development server after adding environment variables

#### 2. "Auth domain not authorized"
**Solution:**
- Add your domain to Firebase Authentication → Settings → Authorized domains
- For development, ensure `localhost` is added

#### 3. "Google OAuth not working"
**Solution:**
- Verify Google Cloud Console OAuth setup
- Check redirect URIs match exactly
- Ensure Google Sign-In is enabled in Firebase

#### 4. "Firestore permission denied"
**Solution:**
- Check Firestore security rules
- Ensure user is authenticated
- Verify user ID matches document owner

#### 5. "Private key format error"
**Solution:**
- Ensure private key includes `\n` characters
- Wrap entire key in double quotes
- Check for any extra spaces or characters

### Debug Steps

1. **Check Environment Variables**
```bash
# In your terminal
echo $NEXT_PUBLIC_FIREBASE_API_KEY
# Should output your API key
```

2. **Check Firebase Console**
- Verify project exists
- Check Authentication users list
- Review Firestore documents

3. **Check Browser Console**
- Look for Firebase errors
- Check network requests
- Verify API calls

4. **Check Server Logs**
```bash
npm run dev
# Look for Firebase initialization messages
```

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use different Firebase projects for development/production
- Rotate secrets regularly

### 2. Firestore Rules
- Always use authentication-based rules
- Limit read/write access to necessary data only
- Test rules thoroughly before production

### 3. Authentication
- Enable multi-factor authentication for admin accounts
- Monitor authentication logs
- Set up proper password policies

### 4. Google OAuth
- Use HTTPS in production
- Regularly review OAuth consent screen
- Monitor OAuth usage and errors

## 📞 Support

If you continue having issues:

1. **Check Firebase Status**
   - Visit [Firebase Status Page](https://status.firebase.google.com/)

2. **Review Firebase Documentation**
   - [Firebase Auth Docs](https://firebase.google.com/docs/auth)
   - [Firestore Docs](https://firebase.google.com/docs/firestore)

3. **Common Solutions**
   - Clear browser cache and cookies
   - Try incognito/private browsing
   - Check browser console for errors
   - Verify network connectivity

4. **Get Help**
   - Firebase Community Forums
   - Stack Overflow (tag: firebase)
   - Firebase Support (paid plans)

---

## ✅ Verification Checklist

Before proceeding, ensure:

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Firestore database created
- [ ] All environment variables set
- [ ] Firebase Admin SDK configured
- [ ] Google OAuth credentials created
- [ ] Security rules implemented
- [ ] Test authentication works
- [ ] Firestore data saving works

Once all items are checked, your Firebase setup is complete! 🎉

**Next Steps:**
- Start development server: `npm run dev`
- Visit: `http://localhost:3000`
- Test the complete authentication flow
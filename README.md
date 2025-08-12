# GLAStudio OAuth Authentication System

A comprehensive OAuth 2.0 authentication system built with Next.js, Firebase, and TypeScript. This system provides secure, scalable authentication services with Google-style user interfaces and session management.

## 🚀 Features

### ✅ Completed Features

- **Multi-Provider Authentication**
  - Google OAuth integration
  - Email/password authentication
  - Firebase Auth backend

- **Google-Style User Interface**
  - Account selection screen (mimics Google's design)
  - Smooth hover animations and transitions
  - Responsive design for all devices
  - Professional loading states

- **Session Management**
  - Cookie-based session persistence
  - Automatic session refresh
  - Secure session encryption
  - 24-hour session duration with 7-day refresh tokens

- **Developer Dashboard**
  - OAuth application management
  - API credentials generation
  - Usage analytics and monitoring
  - Real-time statistics

- **Security Features**
  - Rate limiting
  - CORS protection
  - Secure cookie handling
  - Session encryption with AES

- **Enhanced UI/UX**
  - Hover animations and scale effects
  - Cursor pointer interactions
  - Smooth transitions (200-300ms)
  - Professional loading spinners
  - Error handling with user-friendly messages

### 🎨 Recent UI/UX Improvements

- **Homepage Enhancements**
  - Added scale and shadow effects on buttons
  - Enhanced feature cards with hover animations
  - Improved testimonial cards with smooth transitions
  - Better visual feedback for all interactive elements

- **Dashboard Improvements**
  - Google-style account selector dropdown
  - Enhanced statistics cards with hover effects
  - Improved navigation with hover states
  - Better form interactions and animations

- **Account Selection**
  - Faithful recreation of Google's account picker
  - Smooth hover effects on account cards
  - Enhanced profile picture interactions
  - Professional language selector

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **Authentication**: Firebase Auth
- **Session Management**: Custom session manager with cookies
- **Type Safety**: TypeScript throughout

### Backend
- **Runtime**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: The core OAuth flow (`/api/oauth/*`) uses server-side logic for security, while all other Firebase interactions (like credential management) are handled by the client-side SDK.
- **Session Storage**: Encrypted cookies
- **Rate Limiting**: Rate-limiter-flexible

### Security
- **Session Encryption**: AES encryption with crypto-js
- **Cookie Security**: HttpOnly, Secure, SameSite
- **CORS Protection**: Configurable origins
- **Rate Limiting**: Per-IP and per-user limits

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- Firebase project with Auth and Firestore enabled
- Google OAuth credentials

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Oauth-auth.glasstudio.auth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Admin (Server-side)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # Session Management
   SESSION_SECRET=your_super_secret_session_key
   NEXT_PUBLIC_SESSION_SECRET=your_public_session_key

   # OAuth Configuration
   OAUTH_CLIENT_ID=your_oauth_client_id
   OAUTH_CLIENT_SECRET=your_oauth_client_secret
   ```

4. **Firebase Setup**
   - Enable Authentication in Firebase Console
   - Add Google as a sign-in provider
   - Configure authorized domains
   - Set up Firestore database

5. **Development Server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see the application.

## 🔧 Usage

### Basic OAuth Flow

1. **Redirect to Authorization**
   ```
   GET /api/oauth/authorize?response_type=code&client_id=your_client_id&redirect_uri=your_callback&scope=profile email&state=random_string
   ```

2. **User Authentication**
   - User is redirected to `/auth/login`
   - Can sign in with Google or email/password
   - Account selection screen for multiple accounts

3. **Authorization Code Exchange**
   ```bash
   POST /api/oauth/token
   Content-Type: application/json

   {
     "grant_type": "authorization_code",
     "code": "authorization_code",
     "client_id": "your_client_id",
     "client_secret": "your_client_secret",
     "redirect_uri": "your_callback"
   }
   ```

4. **Access User Information**
   ```bash
   GET /api/oauth/userinfo
   Authorization: Bearer access_token
   ```

### Developer Dashboard

1. **Access Dashboard**
   ```
   GET /dashboard
   ```

2. **Create OAuth Application**
   - Navigate to dashboard
   - Click "Create Application"
   - Fill in application details
   - Get client credentials

3. **Monitor Usage**
   - View real-time statistics
   - Monitor API usage
   - Check success rates

## 🔧 OAuth REST API Reference

This section provides a complete guide for developers integrating with the Glasstudio OAuth 2.0 API.

### 1. Creating an OAuth Application

Before you can use the API, you must create an OAuth application in the developer dashboard.

1.  Navigate to your **Dashboard**.
2.  Click on **"Create New Credentials"**.
3.  Fill in the required details for your application, such as the application name and redirect URIs.
4.  Once created, you will be provided with a **Client ID** and a **Client Secret**.
    **Important:** The Client Secret is shown only once. Store it securely.

### 2. The Authorization Flow (Authorization Code Grant)

This is the standard flow for web applications to obtain an access token on behalf of a user.

**Step A: Redirect the User to the Authorization URL**

Your application should redirect the user to the following endpoint with the specified parameters:

`GET /api/oauth/authorize`

**Query Parameters:**

| Parameter       | Required | Description                                                                                             |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `response_type` | Yes      | Must be `code`.                                                                                         |
| `client_id`     | Yes      | Your application's Client ID.                                                                           |
| `redirect_uri`  | Yes      | The URL to redirect the user back to after authorization. Must be one of the registered redirect URIs.    |
| `scope`         | Yes      | A space-separated list of scopes you are requesting (e.g., `profile email`).                            |
| `state`         | No       | An opaque value used to maintain state between the request and callback. Recommended for security.      |

**Step B: User Authorizes & Receives Code**

If the user approves, they will be redirected back to your `redirect_uri` with an authorization `code`.

### 3. Exchanging the Code for an Access Token

`POST /api/oauth/token`

Use this endpoint to exchange the authorization code for an access token and a refresh token.

**Request Body:**

```json
{
  "grant_type": "authorization_code",
  "code": "THE_CODE_FROM_STEP_2",
  "redirect_uri": "YOUR_REGISTERED_REDIRECT_URI",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

**Success Response (200 OK):**

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "profile email"
}
```

### 4. Refreshing an Access Token

`POST /api/oauth/token`

When an access token expires, use the refresh token to get a new one without user interaction.

**Request Body:**

```json
{
  "grant_type": "refresh_token",
  "refresh_token": "THE_REFRESH_TOKEN",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

**Success Response (200 OK):**

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "profile email"
}
```

### 5. Validating an Access Token

`GET /api/oauth/validate?token={access_token}`

Check if an access token is currently active and valid.

**Success Response (200 OK):**

```json
{
  "active": true,
  "scope": "profile email",
  "client_id": "...",
  "user_id": "...",
  "expires_in": 3599
}
```

**Error Response (401 Unauthorized):**

```json
{
  "active": false
}
```

### 6. Revoking an Access Token (Logout)

`POST /api/oauth/logout`

Invalidate an access token, effectively logging the user out.

**Request Body:**

```json
{
  "token": "THE_ACCESS_TOKEN_TO_REVOKE"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Token successfully revoked."
}
```

## 📚 API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/oauth/authorize` | GET | Initiate OAuth flow |
| `/api/oauth/token` | POST | Exchange code for token |
| `/api/oauth/userinfo` | GET | Get user profile |
| `/api/auth/refresh` | POST | Refresh session |

### Management Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/credentials` | GET/POST | Manage OAuth applications |
| `/api/user` | GET/PUT | User profile management |
| `/api/health` | GET | System health check |

## 🎯 Session Management

### Client-Side Usage
```typescript
import { SessionManager, useSession } from '@/lib/session';

// In React component
const { getSession, clearSession, isAuthenticated } = useSession();

// Check authentication
if (isAuthenticated()) {
  const user = getCurrentUser();
  console.log('Authenticated user:', user);
}

// Manual session management
const sessionManager = SessionManager.getInstance();
sessionManager.updateActivity(); // Update last activity
```

### Server-Side Usage
```typescript
import { ServerSessionManager, withAuth } from '@/lib/session';

// Protected API route
export const GET = withAuth(async (req) => {
  const session = req.session; // Session is automatically attached
  return Response.json({ user: session.userId });
});

// Manual session verification
const session = ServerSessionManager.getSessionFromRequest(req);
if (session) {
  // User is authenticated
}
```

## 🔄 Recent Progress

### Phase 1: Foundation ✅
- [x] Basic OAuth flow implementation
- [x] Firebase integration
- [x] TypeScript setup
- [x] UI framework setup

### Phase 2: Authentication Flow ✅
- [x] Google OAuth integration
- [x] Email/password authentication
- [x] Session management system
- [x] Cookie-based persistence

### Phase 3: UI/UX Enhancements ✅
- [x] Hover animations and transitions
- [x] Google-style account selection
- [x] Professional loading states
- [x] Responsive design improvements
- [x] Enhanced dashboard interface

### Phase 4: Security & Session Management ✅
- [x] Session encryption
- [x] Automatic session refresh
- [x] Secure cookie handling
- [x] Rate limiting implementation

## 🚧 Roadmap

### Immediate Priorities
- [ ] Comprehensive test suite
- [ ] API documentation generator
- [ ] Advanced analytics dashboard
- [ ] Webhook system for events

### Future Enhancements
- [ ] Multi-factor authentication
- [ ] Social login providers (GitHub, Microsoft)
- [ ] Advanced user management
- [ ] Custom domain support
- [ ] Enterprise features

## 🛠️ Development

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Developer dashboard
│   └── page.tsx           # Homepage
├── components/            # Reusable components
├── lib/                   # Utility libraries
│   ├── firebase-client.ts # Firebase client config
│   ├── firebase.ts        # Firebase utility functions (client-side)
│   ├── session.ts         # Session management
│   └── utils.ts           # Helper utilities
└── types/                 # TypeScript definitions
```

### Key Components
- **SessionManager**: Client-side session handling
- **ServerSessionManager**: Server-side session verification
- **Firebase Client**: Authentication and Firestore operations
- **Rate Limiter**: API protection and throttling

### Debugging

1. **Check Session Status**
   ```bash
   # Open browser console
   localStorage.getItem('glasstudio_session')
   ```

2. **Verify API Health**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Test OAuth Flow**
   ```bash
   # Use the test console at /test
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🆘 Support

For support, please:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub
4. Contact the development team

---

**Built with ❤️ by the GLAStudio team**

Last updated: December 2024
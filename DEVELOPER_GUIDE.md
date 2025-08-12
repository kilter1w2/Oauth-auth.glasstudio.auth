# 🧑‍💻 GLAStudio OAuth - Developer Guide

## Overview

GLAStudio OAuth provides a secure, easy-to-implement OAuth 2.0 service for your applications. This guide will walk you through integrating OAuth authentication into your apps, managing users, and tracking app usage.

## 🚀 Quick Start

### 1. Create Your Application

First, you need to register your application to get credentials:

```bash
POST /api/credentials
Content-Type: application/json

{
  "appName": "My Awesome App",
  "description": "A cool application that needs OAuth",
  "redirectUris": ["https://myapp.com/callback"],
  "allowedOrigins": ["https://myapp.com"],
  "scopes": ["profile", "email"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "gla_abc123def456",
    "clientSecret": "gls_secret789xyz",
    "apiKey": "gla_apikey123456",
    "credentialId": "cred_789012345"
  }
}
```

### 2. Generate OAuth URL

Use your credentials to generate an OAuth URL for users:

```bash
GET /api/generate/{clientId}/{clientSecret}/grab/
```

**Example:**
```bash
GET /api/generate/gla_abc123def456/gls_secret789xyz/grab/?redirect_uri=https://myapp.com/callback&state=random123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://oauth.glasstudio.com/api/oauth2/token?e7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6/a1b2c3/verify?=https://myapp.com/callback/782945/934871/1703025600",
    "expiresIn": 3600,
    "parameters": {
      "encryptedUserId": "e7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      "randomizedId": "a1b2c3",
      "redirectUri": "https://myapp.com/callback",
      "requestId": "782945",
      "userNumber": "934871",
      "expiration": "1703025600"
    }
  }
}
```

### 3. Handle Authorization

When users visit the OAuth URL, they'll be redirected back to your `redirect_uri` with an authorization code:

```
https://myapp.com/callback?code=auth_code_here&state=random123
```

### 4. Exchange Code for Token

```bash
POST /api/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "auth_code_here",
  "redirect_uri": "https://myapp.com/callback",
  "client_id": "gla_abc123def456",
  "client_secret": "gls_secret789xyz"
}
```

**Response:**
```json
{
  "access_token": "access_token_value",
  "refresh_token": "refresh_token_value",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "profile email"
}
```

## 📊 Managing Your Application

### View Your App Dashboard

```bash
GET /api/apps/{clientId}
Authorization: Bearer {your_dev_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "app": {
      "clientId": "gla_abc123def456",
      "name": "My Awesome App",
      "description": "A cool application that needs OAuth",
      "createdAt": "2024-01-15T10:30:00Z",
      "stats": {
        "totalUsers": 150,
        "activeUsers": 89,
        "totalRequests": 2500
      }
    },
    "credentials": {
      "clientId": "gla_abc123def456",
      "clientSecret": "gls_secret789xyz",
      "apiKey": "gla_apikey123456"
    },
    "connectedUsers": [
      {
        "userId": "user_001",
        "username": "john_doe",
        "displayName": "John Doe",
        "email": "john@example.com",
        "avatar": "https://avatar.glasstudio.com/user_001.jpg",
        "connectedAt": "2024-01-10T14:20:00Z",
        "lastActive": "2024-01-15T09:15:00Z",
        "scopes": ["profile", "email"]
      },
      {
        "userId": "user_002",
        "username": "jane_smith",
        "displayName": "Jane Smith", 
        "email": "jane@example.com",
        "avatar": "https://avatar.glasstudio.com/user_002.jpg",
        "connectedAt": "2024-01-12T16:45:00Z",
        "lastActive": "2024-01-15T08:30:00Z",
        "scopes": ["profile"]
      }
    ]
  }
}
```

### Get All Your API Keys

```bash
GET /api/keys/{yourUserId}
Authorization: Bearer {your_dev_token}
```

## 🔗 OAuth URL Structure Explained

When you call `/api/generate/{clientId}/{clientSecret}/grab/`, the system generates a complex OAuth URL:

```
/api/oauth2/token?{128_encrypted_userid}/{randomized_encrypted_id}/verify?={redirect_uri}/{request_id}/{user_number}/{expiration_time}
```

**URL Components:**

1. **128 Encrypted User ID**: A 128-character encrypted string representing the user session
2. **Randomized Encrypted ID**: A 6-character encrypted identifier that's randomized 10 times
3. **Redirect URI**: Your registered callback URL
4. **Request ID**: Unique identifier for this OAuth request
5. **User Number**: Internal user tracking number
6. **Expiration Time**: Unix timestamp when the OAuth request expires

**Example Generated URL:**
```
https://oauth.glasstudio.com/api/oauth2/token?e7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6/a1b2c3/verify?=https://myapp.com/callback/782945/934871/1703025600
```

## 🛠️ Integration Examples

### React/Next.js Integration

```javascript
// utils/oauth.js
export class OAuthClient {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = 'https://oauth.glasstudio.com';
  }

  async generateAuthUrl(redirectUri, state = null) {
    const response = await fetch(
      `${this.baseUrl}/api/generate/${this.clientId}/${this.clientSecret}/grab/?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state || Date.now()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to generate OAuth URL');
    }
    
    const data = await response.json();
    return data.data.authUrl;
  }

  async exchangeCodeForToken(code, redirectUri) {
    const response = await fetch(`${this.baseUrl}/api/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }
}

// pages/login.js
import { OAuthClient } from '../utils/oauth';

export default function LoginPage() {
  const oauth = new OAuthClient('your_client_id', 'your_client_secret');

  const handleLogin = async () => {
    try {
      const authUrl = await oauth.generateAuthUrl(
        'https://myapp.com/callback',
        'login_state_123'
      );
      window.location.href = authUrl;
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  return (
    <button onClick={handleLogin}>
      Login with GLAStudio OAuth
    </button>
  );
}

// pages/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { OAuthClient } from '../utils/oauth';

export default function CallbackPage() {
  const router = useRouter();
  const oauth = new OAuthClient('your_client_id', 'your_client_secret');

  useEffect(() => {
    const handleCallback = async () => {
      const { code, state } = router.query;
      
      if (code) {
        try {
          const tokenData = await oauth.exchangeCodeForToken(
            code,
            'https://myapp.com/callback'
          );
          
          // Store token securely
          localStorage.setItem('access_token', tokenData.access_token);
          
          // Redirect to dashboard
          router.push('/dashboard');
        } catch (error) {
          console.error('Token exchange failed:', error);
          router.push('/login?error=oauth_failed');
        }
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query]);

  return <div>Processing OAuth callback...</div>;
}
```

### Node.js/Express Integration

```javascript
// oauth-client.js
const axios = require('axios');

class GLAStudioOAuth {
  constructor(clientId, clientSecret, baseUrl = 'https://oauth.glasstudio.com') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
  }

  async generateAuthUrl(redirectUri, scopes = 'profile email', state = null) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/generate/${this.clientId}/${this.clientSecret}/grab/`,
        {
          params: {
            redirect_uri: redirectUri,
            scope: scopes,
            state: state || `state_${Date.now()}`
          }
        }
      );
      
      return response.data.data.authUrl;
    } catch (error) {
      throw new Error(`Failed to generate OAuth URL: ${error.message}`);
    }
  }

  async exchangeCodeForToken(code, redirectUri) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/oauth/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }
}

module.exports = GLAStudioOAuth;

// app.js
const express = require('express');
const GLAStudioOAuth = require('./oauth-client');

const app = express();
const oauth = new GLAStudioOAuth('your_client_id', 'your_client_secret');

// Login route
app.get('/login', async (req, res) => {
  try {
    const authUrl = await oauth.generateAuthUrl(
      'https://myapp.com/callback',
      'profile email',
      'login_session_123'
    );
    
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Callback route
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    const tokenData = await oauth.exchangeCodeForToken(
      code,
      'https://myapp.com/callback'
    );
    
    const userInfo = await oauth.getUserInfo(tokenData.access_token);
    
    // Store tokens securely (use session, database, etc.)
    req.session.accessToken = tokenData.access_token;
    req.session.user = userInfo;
    
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Python Integration

```python
import requests
import json
from urllib.parse import urlencode

class GLAStudioOAuth:
    def __init__(self, client_id, client_secret, base_url="https://oauth.glasstudio.com"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url
    
    def generate_auth_url(self, redirect_uri, scopes="profile email", state=None):
        """Generate OAuth authorization URL"""
        params = {
            'redirect_uri': redirect_uri,
            'scope': scopes,
            'state': state or f"state_{int(time.time())}"
        }
        
        url = f"{self.base_url}/api/generate/{self.client_id}/{self.client_secret}/grab/"
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            return data['data']['authUrl']
        else:
            raise Exception(f"Failed to generate OAuth URL: {response.text}")
    
    def exchange_code_for_token(self, code, redirect_uri):
        """Exchange authorization code for access token"""
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(f"{self.base_url}/api/oauth/token", json=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Token exchange failed: {response.text}")
    
    def get_user_info(self, access_token):
        """Get user information using access token"""
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(f"{self.base_url}/api/oauth/userinfo", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to get user info: {response.text}")

# Usage example
oauth_client = GLAStudioOAuth('your_client_id', 'your_client_secret')

# Generate login URL
auth_url = oauth_client.generate_auth_url(
    redirect_uri='https://myapp.com/callback',
    state='my_state_123'
)
print(f"Visit this URL to login: {auth_url}")

# After user authorization, exchange code for token
token_data = oauth_client.exchange_code_for_token(
    code='received_auth_code',
    redirect_uri='https://myapp.com/callback'
)

# Get user information
user_info = oauth_client.get_user_info(token_data['access_token'])
print(f"User: {user_info['name']} ({user_info['email']})")
```

## 📊 App Management & Analytics

### View Your App Details

Get comprehensive information about your application, including connected users:

```bash
GET /api/apps/{clientId}
Authorization: Bearer {your_dev_token}
```

This endpoint provides:
- App metadata and settings
- Client credentials (ID and secret)
- List of all connected users with their details
- Usage statistics and analytics

### Track User Connections

Monitor which users have authorized your app and their activity:

```bash
GET /api/apps/{clientId}/users
Authorization: Bearer {your_dev_token}
```

**Response includes:**
- User profile information (name, username, avatar)
- Connection timestamp
- Last activity
- Granted scopes
- Token status

### App Statistics

```bash
GET /api/apps/{clientId}/stats
Authorization: Bearer {your_dev_token}
```

Get insights about your app usage:
- Total number of users
- Active users (last 30 days)
- API request counts
- Authentication success rates
- Geographic distribution

## 🔐 Security Best Practices

### 1. Secure Credential Storage

**Never expose your client secret in frontend code!**

```javascript
// ❌ WRONG - Client secret exposed
const oauth = new OAuthClient('client_id', 'client_secret_exposed');

// ✅ CORRECT - Use environment variables on server
const oauth = new OAuthClient(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET
);
```

### 2. State Parameter Validation

Always use and validate the state parameter to prevent CSRF attacks:

```javascript
// Generate random state
const state = crypto.randomBytes(16).toString('hex');
sessionStorage.setItem('oauth_state', state);

// Validate on callback
const receivedState = urlParams.get('state');
const storedState = sessionStorage.getItem('oauth_state');

if (receivedState !== storedState) {
  throw new Error('Invalid state parameter - possible CSRF attack');
}
```

### 3. Token Security

```javascript
// Store tokens securely
// ❌ WRONG - localStorage is vulnerable to XSS
localStorage.setItem('access_token', token);

// ✅ BETTER - Use httpOnly cookies or secure session storage
document.cookie = `access_token=${token}; httpOnly; secure; sameSite=strict`;

// ✅ BEST - Server-side session management
req.session.accessToken = token;
```

## 📝 API Response Formats

### Success Response Format

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CLIENT",
    "message": "Invalid client credentials",
    "details": "The provided client ID or secret is incorrect"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔧 Testing Your Integration

### 1. Test OAuth Flow

```bash
# Test credential creation
curl -X POST https://oauth.glasstudio.com/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "Test App",
    "redirectUris": ["http://localhost:3000/callback"]
  }'

# Test OAuth URL generation
curl "https://oauth.glasstudio.com/api/generate/your_client_id/your_client_secret/grab/?redirect_uri=http://localhost:3000/callback"
```

### 2. Test Token Exchange

```bash
curl -X POST https://oauth.glasstudio.com/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "test_auth_code",
    "redirect_uri": "http://localhost:3000/callback",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'
```

## 🚨 Common Issues & Solutions

### Issue 1: Invalid Client Credentials
```json
{
  "error": "INVALID_CLIENT",
  "message": "Invalid client ID or secret"
}
```
**Solution**: Verify your client ID and secret are correct and haven't expired.

### Issue 2: Redirect URI Mismatch
```json
{
  "error": "REDIRECT_URI_MISMATCH", 
  "message": "Redirect URI does not match registered URIs"
}
```
**Solution**: Ensure the redirect URI exactly matches what you registered when creating credentials.

### Issue 3: Expired Authorization Code
```json
{
  "error": "INVALID_GRANT",
  "message": "Authorization code has expired"
}
```
**Solution**: Authorization codes expire after 10 minutes. Request a new OAuth URL.

## 📚 Advanced Features

### Custom Scopes

Define custom scopes for your application:

```json
{
  "appName": "My App",
  "scopes": ["profile", "email", "read:posts", "write:comments"]
}
```

### Webhook Notifications

Get notified when users authorize or revoke your app:

```bash
POST /api/apps/{clientId}/webhooks
{
  "url": "https://myapp.com/webhooks/oauth",
  "events": ["user.authorized", "user.revoked"]
}
```

### Refresh Tokens

Refresh expired access tokens:

```bash
POST /api/oauth/token
{
  "grant_type": "refresh_token",
  "refresh_token": "your_refresh_token",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret"
}
```

## 📞 Support

- **Documentation**: [Full API Reference](./REST_API_REFERENCE.md)
- **User Guide**: [User Guide](./USER_GUIDE.md)
- **Issues**: Report bugs and issues through our support channel
- **Examples**: Check `/examples` directory for more integration samples

## 🎯 Next Steps

1. **Create your first app** using `/api/credentials`
2. **Test the OAuth flow** with the generated URLs
3. **Implement the integration** using our code examples
4. **Monitor your app** through the dashboard endpoints
5. **Scale and optimize** based on usage analytics

Ready to get started? Create your first OAuth application now!
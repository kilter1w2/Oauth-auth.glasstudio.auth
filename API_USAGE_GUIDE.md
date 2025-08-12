# GLAStudio OAuth API Usage Guide

## 🔧 Quick Fix for Firebase Issues

### Problem
You're seeing these errors:
- `Failed to parse private key: Error: Invalid PEM formatted message`
- `Database not initialized`

### Solution
Your Firebase Admin SDK credentials are not properly configured. Follow these steps:

#### Option 1: Automatic Setup (Recommended)
```bash
node setup-firebase.js
```

#### Option 2: Manual Setup
1. **Get Firebase Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: `itdiary-ase`
   - Go to **Project Settings > Service Accounts**
   - Click **"Generate new private key"**
   - Download the JSON file

2. **Update `.env.local`**:
   Open the downloaded JSON and copy these values to your `.env.local`:
   ```env
   FIREBASE_PROJECT_ID=your-actual-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
   ```

3. **Restart your server**:
   ```bash
   npm run dev
   ```

---

## 🚀 API Endpoints

### 1. Generate OAuth URL (Your Requested Feature)
**Endpoint**: `/api/generate/{id}/{public-api-key}/grab/`

**Method**: `GET` or `POST`

**Description**: Generates an OAuth authorization URL that users can visit to authorize your application.

**Parameters**:
- `{id}`: Your API credential ID
- `{public-api-key}`: Your public API key
- `redirect_uri` (query param): Where to redirect after authorization
- `scope` (query param, optional): Requested scopes (default: "profile email")
- `state` (query param, optional): State parameter for security

**Example Request**:
```http
GET /api/generate/cred_123456/gla_abcdef123456/grab/?redirect_uri=http://localhost:3000/callback&scope=profile email&state=my_state_123
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "oauth_url": "http://localhost:3000/api/oauth/authorize?response_type=code&client_id=gla_gugpi91gkrh&redirect_uri=http://localhost:3000/callback&scope=profile email&state=my_state_123",
    "client_id": "gla_gugpi91gkrh",
    "redirect_uri": "http://localhost:3000/callback",
    "scope": "profile email",
    "state": "my_state_123",
    "expires_in": 3600,
    "api_name": "My OAuth App",
    "api_description": "OAuth integration for my application"
  },
  "message": "OAuth URL generated successfully"
}
```

### 2. Get User API Keys
**Endpoint**: `/api/keys/{userId}`

**Method**: `GET`

**Description**: Retrieves all API credentials for a user, including public/private keys and usage instructions.

**Example Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "credentials": [
      {
        "id": "cred_123456",
        "name": "My OAuth App",
        "clientId": "gla_gugpi91gkrh",
        "clientSecret": "gls_secret123456",
        "apiKey": "gla_abcdef123456",
        "oauthUrlTemplate": "http://localhost:3000/api/generate/cred_123456/gla_abcdef123456/grab",
        "usageInstructions": {
          "generateOAuthUrl": "GET http://localhost:3000/api/generate/cred_123456/gla_abcdef123456/grab?redirect_uri=YOUR_REDIRECT_URI&scope=profile email&state=YOUR_STATE",
          "authorizeUrl": "http://localhost:3000/api/oauth/authorize",
          "tokenUrl": "http://localhost:3000/api/oauth/token",
          "userinfoUrl": "http://localhost:3000/api/oauth/userinfo"
        }
      }
    ]
  }
}
```

### 3. Create New API Credentials
**Endpoint**: `/api/credentials`

**Method**: `POST`

**Body**:
```json
{
  "userId": "user_123",
  "name": "My New OAuth App",
  "description": "OAuth integration for my new application",
  "redirectUris": ["http://localhost:3000/callback"],
  "allowedOrigins": ["http://localhost:3000"],
  "scopes": ["profile", "email"],
  "rateLimit": {
    "maxRequests": 1000,
    "windowMs": 3600000
  }
}
```

### 4. OAuth Authorization Flow
**Endpoint**: `/api/oauth/authorize`

**Method**: `GET`

**Parameters**:
- `response_type=code`
- `client_id`: Your client ID
- `redirect_uri`: Your registered redirect URI
- `scope`: Requested scopes
- `state`: Security state parameter

---

## 🔄 Complete OAuth Flow Example

### Step 1: Create API Credentials
```bash
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "name": "My OAuth App",
    "redirectUris": ["http://localhost:3000/callback"],
    "scopes": ["profile", "email"]
  }'
```

### Step 2: Generate OAuth URL
```bash
curl "http://localhost:3000/api/generate/cred_123456/gla_abcdef123456/grab/?redirect_uri=http://localhost:3000/callback&scope=profile email&state=my_state"
```

### Step 3: User Authorization
Direct users to the `oauth_url` from Step 2. They'll see a page where they can:
- Sign in to your platform
- Create a new account
- Authorize your application

### Step 4: Handle Authorization Code
After authorization, users are redirected to your `redirect_uri` with:
- `code`: Authorization code
- `state`: Your original state parameter

### Step 5: Exchange Code for Token
```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "auth_code_from_step_4",
    "redirect_uri": "http://localhost:3000/callback",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'
```

---

## 🛠️ Integration Examples

### JavaScript/Node.js
```javascript
// Generate OAuth URL
const response = await fetch(
  'http://localhost:3000/api/generate/cred_123456/gla_abcdef123456/grab/?redirect_uri=http://localhost:3000/callback&scope=profile email'
);
const data = await response.json();

// Redirect user to OAuth URL
window.location.href = data.data.oauth_url;
```

### Python
```python
import requests

# Generate OAuth URL
response = requests.get(
    'http://localhost:3000/api/generate/cred_123456/gla_abcdef123456/grab/',
    params={
        'redirect_uri': 'http://localhost:3000/callback',
        'scope': 'profile email',
        'state': 'my_state_123'
    }
)

oauth_data = response.json()
oauth_url = oauth_data['data']['oauth_url']

# Direct user to oauth_url for authorization
print(f"Visit this URL to authorize: {oauth_url}")
```

### cURL
```bash
# Generate OAuth URL
curl "http://localhost:3000/api/generate/YOUR_CRED_ID/YOUR_API_KEY/grab/?redirect_uri=YOUR_REDIRECT_URI&scope=profile email&state=YOUR_STATE"
```

---

## 🔐 Security Features

- **Rate Limiting**: All endpoints are rate-limited per user and per API credential
- **Security Logging**: All requests are logged for audit purposes
- **Input Validation**: All parameters are validated and sanitized
- **CORS Support**: Proper CORS headers for cross-origin requests
- **Error Handling**: Comprehensive error responses with appropriate HTTP status codes

---

## 📋 Next Steps

1. **Fix Firebase**: Run `node setup-firebase.js` or manually update `.env.local`
2. **Test API**: Use `/api/keys/{userId}` to see your credentials
3. **Generate OAuth URLs**: Use `/api/generate/{id}/{apiKey}/grab/` endpoint
4. **Integrate**: Follow the examples above to integrate with your application

The system now works like Google OAuth - users visit your generated OAuth URL, sign in or create an account on your platform, and authorize your application!

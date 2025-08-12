# 🛠️ Developer Dashboard Guide

A comprehensive guide for developers to manage their OAuth applications, view credentials, and monitor user connections through the GLAStudio Developer Dashboard.

## 📋 Table of Contents

- [Overview](#overview)
- [Dashboard Access](#dashboard-access)
- [Application Management](#application-management)
- [Credential Management](#credential-management)
- [User Analytics](#user-analytics)
- [API Integration](#api-integration)
- [Security Best Practices](#security-best-practices)

## 🌟 Overview

The Developer Dashboard provides a comprehensive interface for managing OAuth applications, including:

- **Application Creation**: Register new OAuth applications
- **Credential Management**: View and manage client IDs and secrets
- **User Analytics**: Monitor connected users and usage statistics
- **Security Monitoring**: Track API usage and security events
- **Real-time Updates**: Live statistics and user activity

## 🔐 Dashboard Access

### Authentication

Access the developer dashboard at: `https://yourdomain.com/dashboard`

You'll need to authenticate with your GLAStudio account to access the dashboard.

### Dashboard Features

| Feature | Description |
|---------|-------------|
| **Applications** | View and manage all your OAuth applications |
| **Analytics** | Real-time usage statistics and user metrics |
| **Security** | Monitor API usage and security events |
| **Settings** | Configure application settings and permissions |

## 📱 Application Management

### Creating a New Application

1. **Navigate to Applications**
   - Click on "Applications" in the sidebar
   - Click "Create New Application"

2. **Fill Application Details**
   ```json
   {
     "appName": "MyCoolApp",
     "description": "A cool application that uses OAuth",
     "redirectUri": "https://mycoolapp.com/callback",
     "scopes": ["profile", "email"],
     "website": "https://mycoolapp.com"
   }
   ```

3. **Configure Settings**
   - **Redirect URIs**: Add all valid redirect URIs for your app
   - **Scopes**: Define what permissions your app needs
   - **Logo**: Upload your application logo (optional)
   - **Privacy Policy**: Link to your privacy policy (required)

4. **Review and Create**
   - Review all settings
   - Click "Create Application"

### Application Dashboard

Once created, you'll see your application dashboard with:

#### Overview Tab
- **Application Status**: Active/Inactive
- **Total Users**: Number of connected users
- **API Calls**: Total API requests made
- **Success Rate**: Percentage of successful requests
- **Last Activity**: Most recent user activity

#### Credentials Tab
- **Client ID**: Your application's unique identifier
- **Client Secret**: Your application's secret key (keep secure!)
- **API Key**: Public API key for URL generation
- **Regenerate Secret**: Option to regenerate client secret

#### Users Tab
- **Connected Users**: List of users who authorized your app
- **User Details**: Username, email, avatar, connection date
- **Last Access**: When user last used your app
- **Permissions**: What data the user has granted access to

#### Analytics Tab
- **Usage Charts**: Daily/weekly/monthly API usage
- **User Growth**: New user connections over time
- **Error Rates**: Failed requests and error types
- **Popular Endpoints**: Most used API endpoints

## 🔑 Credential Management

### Viewing Credentials

1. **Access Credentials**
   - Go to your application dashboard
   - Click on "Credentials" tab
   - View your Client ID and API Key

2. **Client Secret Security**
   - Client Secret is hidden by default
   - Click "Show Secret" to reveal (use with caution)
   - Click "Regenerate Secret" to create a new one

### API Key Management

Your API Key is used for generating OAuth URLs:

```javascript
// Example: Generate OAuth URL
const oauthUrl = `https://yourdomain.com/api/generate/${clientId}/${apiKey}/grab?redirect_uri=${redirectUri}&scope=profile email`;
```

### Security Best Practices

1. **Never expose Client Secret in client-side code**
2. **Store credentials securely on your server**
3. **Use environment variables for sensitive data**
4. **Regularly rotate Client Secrets**
5. **Monitor for suspicious activity**

## 📊 User Analytics

### Connected Users

View all users who have authorized your application:

| Column | Description |
|--------|-------------|
| **User** | Username and avatar |
| **Email** | User's email address |
| **Connected** | Date when user authorized your app |
| **Last Access** | Most recent activity |
| **Status** | Active/Inactive |
| **Actions** | View details, revoke access |

### User Details

Click on any user to see detailed information:

```json
{
  "userId": "user_123",
  "username": "john_doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "name": "John Doe",
  "connectedAt": "2024-01-15T10:30:00Z",
  "lastAccess": "2024-01-20T14:45:00Z",
  "permissions": ["profile", "email"],
  "apiCalls": 1250,
  "lastApiCall": "2024-01-20T14:45:00Z"
}
```

### Usage Statistics

Monitor your application's performance:

#### API Usage
- **Total Requests**: All API calls made
- **Successful Requests**: Successful API responses
- **Failed Requests**: Failed API calls
- **Success Rate**: Percentage of successful requests

#### User Metrics
- **Total Users**: Number of unique users
- **Active Users**: Users with recent activity
- **New Users**: Users who connected this period
- **Churn Rate**: Users who revoked access

#### Performance Metrics
- **Average Response Time**: API response latency
- **Peak Usage**: Highest concurrent usage
- **Error Types**: Most common error codes
- **Popular Endpoints**: Most used API endpoints

## 🔌 API Integration

### Quick Integration Guide

1. **Get Your Credentials**
   ```javascript
   // From your dashboard
   const clientId = 'your_client_id';
   const apiKey = 'your_api_key';
   const redirectUri = 'https://myapp.com/callback';
   ```

2. **Generate OAuth URL**
   ```javascript
   const generateOAuthUrl = async () => {
     const response = await fetch(
       `https://yourdomain.com/api/generate/${clientId}/${apiKey}/grab?redirect_uri=${redirectUri}&scope=profile email`
     );
     const data = await response.json();
     return data.data.oauth_url;
   };
   ```

3. **Handle OAuth Flow**
   ```javascript
   // Redirect user to OAuth URL
   const oauthUrl = await generateOAuthUrl();
   window.location.href = oauthUrl;

   // Handle callback
   const urlParams = new URLSearchParams(window.location.search);
   const code = urlParams.get('code');
   
   if (code) {
     // Exchange code for token
     const tokenResponse = await fetch('/api/oauth/token', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         code,
         clientId,
         clientSecret: 'your_client_secret', // Keep secure!
         redirectUri
       })
     });
     
     const tokenData = await tokenResponse.json();
     console.log('Access Token:', tokenData.data.accessToken);
   }
   ```

### SDK Integration

Use our official SDK for easier integration:

```javascript
import { GLAStudioOAuth } from '@glasstudio/oauth';

const oauth = new GLAStudioOAuth({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  redirectUri: 'https://myapp.com/callback'
});

// Generate OAuth URL
const authUrl = await oauth.generateAuthUrl();

// Handle callback
const tokens = await oauth.handleCallback(code);
const user = await oauth.getUserProfile(tokens.accessToken);
```

## 🛡️ Security Best Practices

### Application Security

1. **Secure Credential Storage**
   ```javascript
   // ✅ Good: Use environment variables
   const clientSecret = process.env.CLIENT_SECRET;
   
   // ❌ Bad: Hardcode in client-side code
   const clientSecret = 'abc123';
   ```

2. **Validate Redirect URIs**
   ```javascript
   // Always validate redirect URIs match your registered ones
   const validRedirectUris = ['https://myapp.com/callback'];
   if (!validRedirectUris.includes(redirectUri)) {
     throw new Error('Invalid redirect URI');
   }
   ```

3. **Implement State Parameter**
   ```javascript
   // Use state parameter to prevent CSRF attacks
   const state = generateRandomString();
   const oauthUrl = `${baseUrl}?state=${state}`;
   
   // Verify state in callback
   if (callbackState !== originalState) {
     throw new Error('State mismatch');
   }
   ```

### User Data Protection

1. **Minimal Data Access**
   - Only request scopes you actually need
   - Don't store unnecessary user data
   - Implement data retention policies

2. **Secure Data Transmission**
   - Always use HTTPS
   - Validate all user inputs
   - Implement proper error handling

3. **User Consent**
   - Clearly explain what data you're accessing
   - Provide easy way to revoke access
   - Respect user privacy preferences

## 📈 Monitoring and Alerts

### Dashboard Monitoring

Monitor your application's health through the dashboard:

#### Real-time Metrics
- **Active Users**: Current online users
- **API Requests**: Requests per minute
- **Error Rate**: Current error percentage
- **Response Time**: Average response latency

#### Alerts and Notifications
- **High Error Rate**: When error rate exceeds threshold
- **Unusual Activity**: Suspicious API usage patterns
- **User Complaints**: Reports from users
- **Security Events**: Potential security issues

### API Monitoring

Track API usage and performance:

```javascript
// Example: Monitor API usage
const monitorApiUsage = async () => {
  const response = await fetch('/api/apps/your_client_id', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const data = await response.json();
  console.log('API Usage:', data.data.usageStats);
};
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Invalid Credentials
**Problem**: Getting "Invalid client ID or secret" error
**Solution**: 
- Verify credentials in dashboard
- Check for typos in client ID/secret
- Ensure credentials are active

#### 2. Redirect URI Mismatch
**Problem**: "Invalid redirect URI" error
**Solution**:
- Add redirect URI to application settings
- Ensure exact match (including protocol and port)
- Check for trailing slashes

#### 3. Rate Limiting
**Problem**: Getting rate limit errors
**Solution**:
- Check rate limit headers
- Implement exponential backoff
- Monitor usage in dashboard

#### 4. Token Expiration
**Problem**: Access tokens expiring
**Solution**:
- Implement token refresh logic
- Store refresh tokens securely
- Handle token expiration gracefully

### Getting Help

1. **Check Documentation**: Review this guide and API docs
2. **Monitor Dashboard**: Check for errors and warnings
3. **Contact Support**: Reach out for technical assistance
4. **Community**: Join developer community for help

## 📞 Support Resources

### Documentation
- [API Documentation](./OAUTH_API_DOCUMENTATION.md)
- [Quick Start Guide](./QUICK_START.md)
- [Security Guide](./SECURITY_GUIDE.md)

### Tools
- **API Explorer**: Test endpoints directly
- **SDK Examples**: Code samples for integration
- **Status Page**: Check service status

### Contact
- **Email**: developers@glasstudio.com
- **Discord**: Join our developer community
- **GitHub**: Report issues and feature requests

---

**Last Updated**: January 2024  
**Dashboard Version**: v2.0  
**API Version**: v1.0
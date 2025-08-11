# Tunnel Setup for GLAStudio OAuth Development

This guide helps you set up a secure tunnel to expose your local development server to the internet, which is required for OAuth callback URLs and testing with external applications.

## Why Do You Need a Tunnel?

OAuth 2.0 requires publicly accessible URLs for:
- **Redirect URIs**: Where users are sent after authentication
- **Webhook endpoints**: For real-time notifications
- **Testing with external apps**: Apps that need to callback to your OAuth server

## Recommended Tunnel Services

### 1. Ngrok (Most Popular)

**Installation:**
```bash
# Download from https://ngrok.com/download
# Or install via package manager:

# macOS
brew install ngrok/ngrok/ngrok

# Windows (Chocolatey)
choco install ngrok

# Linux (Snap)
snap install ngrok
```

**Setup:**
```bash
# Sign up at https://ngrok.com and get your authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN

# Start tunnel for your Next.js app (port 3000)
ngrok http 3000

# For custom subdomain (paid plans)
ngrok http 3000 --subdomain=myoauth
```

**Example output:**
```
Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

### 2. Cloudflare Tunnel (Free)

**Installation:**
```bash
# Download cloudflared from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Quick tunnel (no setup required)
cloudflared tunnel --url http://localhost:3000
```

### 3. LocalTunnel (Simple)

**Installation:**
```bash
npm install -g localtunnel
```

**Usage:**
```bash
# Start your Next.js app first (npm run dev)
# Then in another terminal:
lt --port 3000 --subdomain myoauth
```

### 4. Tailscale Funnel (Secure)

**Installation:**
```bash
# Install Tailscale from https://tailscale.com/download
# Enable Funnel feature
tailscale funnel 3000
```

## Configuration for Your OAuth System

Once you have your tunnel URL (e.g., `https://abc123.ngrok.io`), update your environment variables:

### Update `.env.local`

```env
# Replace localhost with your tunnel URL
APP_URL=https://abc123.ngrok.io
APP_DOMAIN=abc123.ngrok.io
NEXTAUTH_URL=https://abc123.ngrok.io

# Keep other settings the same
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDAupXvxYn4UQQmqPxUQGYwQ551N20ILpk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=itdiary-ase.firebaseapp.com
# ... other Firebase settings
```

### Update Firebase Auth Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`itdiary-ase`)
3. Navigate to Authentication > Settings > Authorized domains
4. Add your tunnel domain: `abc123.ngrok.io`

### Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Credentials > OAuth 2.0 Client IDs
3. Add authorized redirect URIs:
   - `https://abc123.ngrok.io/api/auth/callback/google`
   - `https://abc123.ngrok.io/auth/callback`

## Quick Start Script

Create this script to automate the process:

**`start-tunnel.sh` (macOS/Linux):**
```bash
#!/bin/bash

echo "Starting GLAStudio OAuth with tunnel..."

# Start Next.js in background
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
sleep 5

# Start ngrok tunnel
echo "Starting ngrok tunnel..."
ngrok http 3000 --log=stdout > ngrok.log &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get the tunnel URL
TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

echo "🚀 Your OAuth system is running at: $TUNNEL_URL"
echo "📝 Update your .env.local with: APP_URL=$TUNNEL_URL"
echo "🔧 Update Firebase and Google OAuth settings with this domain"

# Wait for user to press Ctrl+C
trap "echo 'Stopping services...'; kill $NEXTJS_PID $NGROK_PID; exit" INT
wait
```

**`start-tunnel.bat` (Windows):**
```batch
@echo off
echo Starting GLAStudio OAuth with tunnel...

REM Start Next.js in background
start /B npm run dev

REM Wait for Next.js to start
timeout /t 5 /nobreak > nul

REM Start ngrok tunnel
echo Starting ngrok tunnel...
start /B ngrok http 3000

echo.
echo Your tunnel should be starting...
echo Check ngrok dashboard at: http://localhost:4040
echo.
echo Remember to:
echo 1. Update .env.local with your tunnel URL
echo 2. Update Firebase authorized domains
echo 3. Update Google OAuth redirect URIs
echo.
pause
```

## Environment-Specific URLs

Your OAuth system will use these URLs with tunneling:

### Authorization Endpoint
```
https://your-tunnel-domain.ngrok.io/api/oauth/authorize
```

### Token Endpoint
```
https://your-tunnel-domain.ngrok.io/api/oauth/token
```

### User Info Endpoint
```
https://your-tunnel-domain.ngrok.io/api/oauth/userinfo
```

### Session URL Format
```
https://your-tunnel-domain.ngrok.io/{session-id}/{rotation-id}/{login-number}
```

## Testing Your Setup

### 1. Test Basic Access
```bash
curl https://your-tunnel-domain.ngrok.io/api/oauth/authorize?response_type=code&client_id=test
```

### 2. Test OAuth Flow
1. Create an application in your dashboard: `https://your-tunnel-domain.ngrok.io/dashboard`
2. Use the generated client_id and redirect_uri
3. Test the full OAuth flow

### 3. Monitor Requests
- **Ngrok**: Visit `http://localhost:4040` for request inspector
- **Cloudflare**: Check dashboard for analytics
- **LocalTunnel**: Check terminal output

## Security Considerations

### For Development Only
- ⚠️ **Never use tunnels in production**
- 🔒 Tunnels expose your local environment to the internet
- 🚫 Don't commit tunnel URLs to version control

### Best Practices
1. **Use HTTPS tunnels only** (all services provide this)
2. **Rotate tunnel URLs regularly** when developing
3. **Monitor tunnel traffic** for unauthorized access
4. **Use authentication** when available (ngrok auth)
5. **Close tunnels** when not needed

### Ngrok Security Features
```bash
# Add basic auth to your tunnel
ngrok http 3000 --auth="username:password"

# Restrict to specific IP addresses
ngrok http 3000 --cidr-allow="192.168.1.0/24"
```

## Troubleshooting

### Common Issues

**1. "Invalid redirect_uri" error**
- Ensure tunnel URL is added to Firebase authorized domains
- Check Google OAuth settings for correct redirect URIs
- Verify tunnel is using HTTPS

**2. Tunnel keeps disconnecting**
- Use paid ngrok plan for stable subdomain
- Consider Cloudflare Tunnel for reliability
- Check internet connection stability

**3. CORS errors**
- Update APP_DOMAIN in .env.local
- Restart Next.js after environment changes
- Check browser console for specific CORS issues

**4. Firebase authentication fails**
- Add tunnel domain to Firebase authorized domains
- Clear browser cache and cookies
- Check Firebase configuration in .env.local

### Getting Help

**Check tunnel status:**
```bash
# Ngrok dashboard
curl http://localhost:4040/api/tunnels

# Check if your app is accessible
curl https://your-tunnel-domain.ngrok.io/api/health
```

**Debug OAuth flow:**
1. Enable debug logging in Next.js
2. Check tunnel request inspector
3. Monitor Firebase authentication logs
4. Test with OAuth playground tools

## Production Deployment

When ready for production:

1. **Deploy to Vercel/Netlify/etc.**
2. **Update environment variables** with production URLs
3. **Configure custom domain** 
4. **Update OAuth providers** with production URLs
5. **Remove tunnel configurations**

## Quick Reference

| Service | Command | Dashboard | Stability |
|---------|---------|-----------|-----------|
| Ngrok | `ngrok http 3000` | `localhost:4040` | ⭐⭐⭐⭐⭐ |
| Cloudflare | `cloudflared tunnel --url localhost:3000` | Cloudflare Dashboard | ⭐⭐⭐⭐ |
| LocalTunnel | `lt --port 3000` | None | ⭐⭐⭐ |
| Tailscale | `tailscale funnel 3000` | Tailscale Admin | ⭐⭐⭐⭐ |

---

**Need help?** Check the main README.md or create an issue in the repository.
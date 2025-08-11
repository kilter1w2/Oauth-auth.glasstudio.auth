# Quick Start Guide - GLAStudio OAuth

Get your OAuth authentication system running in under 10 minutes! 🚀

## 🏃‍♂️ Super Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" → Enter name → Create project
3. Enable Authentication → Sign-in method → Enable "Email/Password" and "Google"
4. Create Firestore database → Start in test mode

### 3. Get Firebase Config
1. Project Settings → General → Your apps → Web app
2. Copy the `firebaseConfig` object values

### 4. Create Environment File
Create `.env.local` in your project root:

```env
# Required: Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Session Management (will use secure defaults)
SESSION_SECRET=your-super-secret-key-here
NEXT_PUBLIC_SESSION_SECRET=your-public-key-here
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Test Your Setup
- Visit: `http://localhost:3000`
- If you see a red warning banner, click "Complete Setup"
- Otherwise, click "Get Started Free" to test authentication

## 🔧 Troubleshooting

### Problem: Firebase Configuration Error
**Error**: `Firebase: Error (auth/configuration-not-found)`

**Solution**:
1. Ensure `.env.local` exists in project root
2. Check all Firebase variables are set correctly
3. Restart development server: `Ctrl+C` then `npm run dev`

### Problem: Auth Domain Not Authorized
**Solution**: Add `localhost` to Firebase Auth authorized domains

### Problem: Missing Configuration Warning
**Solution**: Visit `/setup` page for guided configuration

## 🎯 What You Get

✅ **Google OAuth** - One-click sign-in  
✅ **Email/Password** - Traditional authentication  
✅ **Session Management** - Automatic session handling  
✅ **Google-Style UI** - Professional interface  
✅ **Developer Dashboard** - Manage applications  
✅ **Security Features** - Rate limiting, encryption  

## 📖 Detailed Guides

- **Complete Setup**: Visit `/setup` in your browser
- **Firebase Setup**: See `FIREBASE_SETUP.md`
- **Full Documentation**: See `README.md`

## 🚀 Next Steps

1. **Test Authentication**: Try signing up and logging in
2. **Create OAuth Apps**: Visit `/dashboard` after login
3. **Integrate with Your App**: Use the OAuth endpoints
4. **Production Setup**: Configure production Firebase project

## 💡 Pro Tips

- Use different Firebase projects for development/production
- Set strong session secrets for production
- Enable Firebase security rules before production
- Monitor usage in Firebase console

## 🆘 Need Help?

1. **Setup Issues**: Visit `http://localhost:3000/setup`
2. **Environment Check**: The setup page shows configuration status
3. **Common Problems**: See troubleshooting section above
4. **Full Guide**: Check `FIREBASE_SETUP.md` for detailed instructions

---

**🎉 You're ready to build!** Your OAuth system is now configured and ready for development.

**Quick Test**: Visit `http://localhost:3000/auth/login` and try signing up with Google!
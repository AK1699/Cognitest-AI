# OAuth SSO Quick Start Guide

Get Cognitest OAuth authentication running in 15 minutes!

## ⚡ 3-Step Quick Setup

### Step 1: Get OAuth Credentials (5 min)

#### Google OAuth
1. Go to: https://console.cloud.google.com/
2. Create Project → Enable Google+ API → Create OAuth Credentials (Web app)
3. Add Redirect URI: `http://localhost:8000/api/v1/auth/google/callback`
4. Copy: Client ID & Client Secret

#### Microsoft OAuth
1. Go to: https://portal.azure.com/ → Azure Active Directory → App registrations
2. New registration → Web redirect URI: `http://localhost:8000/api/v1/auth/microsoft/callback`
3. Create client secret
4. Copy: Client ID & Secret

#### Apple OAuth
1. Go to: https://developer.apple.com/ → Certificates, Identifiers & Profiles
2. Create App ID → Enable "Sign in with Apple"
3. Create Service ID → Configure return URL: `http://localhost:8000/api/v1/auth/apple/callback`
4. Create private key (.p8 file)
5. Copy: Service ID, Team ID, Key ID

### Step 2: Configure Backend (3 min)

Edit `/backend/.env`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret

# Apple OAuth
APPLE_CLIENT_ID=your-service-id
APPLE_CLIENT_SECRET=your-client-secret
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
```

### Step 3: Test (2 min)

```bash
# Terminal 1: Start backend
cd backend && uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd frontend && npm run dev

# Browser: Go to http://localhost:3000/auth/signin
# Click any OAuth button and sign in!
```

Done! ✅

---

## 📚 Next Steps

- **Full Setup Guide:** See `/OAUTH_IMPLEMENTATION_GUIDE.md`
- **Implementation Details:** See `/SSO_IMPLEMENTATION_SUMMARY.md`
- **Production Deployment:** See `/OAUTH_IMPLEMENTATION_GUIDE.md` → Deployment section

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not configured" error | Missing credentials in `.env` |
| Google popup won't open | Disable ad blocker, check CORS |
| Invalid redirect URI | Redirect URI must match exactly in OAuth provider settings |
| Tokens not setting | Using HTTPS in dev (should be HTTP) |

For more help, see `/OAUTH_IMPLEMENTATION_GUIDE.md` → Troubleshooting section.

---

## 🔗 Useful Links

- [Google OAuth Console](https://console.cloud.google.com/)
- [Azure Portal](https://portal.azure.com/)
- [Apple Developer](https://developer.apple.com/)
- [OAuth 2.0 Spec](https://tools.ietf.org/html/rfc6749)

---

## ✨ Features

✅ Google, Microsoft, and Apple sign-in
✅ Account linking (connect multiple providers)
✅ Secure HttpOnly cookies
✅ Automatic user creation
✅ Profile picture & name sync
✅ Production ready

---

**Time to Setup:** ~15 minutes
**Difficulty:** Easy
**Status:** Ready to Deploy 🚀

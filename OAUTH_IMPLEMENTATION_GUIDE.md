# Cognitest OAuth SSO Implementation Guide

Complete guide for implementing and using Google, Microsoft, and Apple OAuth authentication in Cognitest.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Configuration](#configuration)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Account Linking](#account-linking)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Cognitest now supports three OAuth providers for sign-in and sign-up:

- **Google** - Google Sign-In with OpenID Connect
- **Microsoft** - Azure AD / Microsoft Account via OAuth 2.0
- **Apple** - Sign in with Apple using OAuth 2.0

### Features

- ✅ Single sign-on (SSO) for all three providers
- ✅ Automatic user account creation on first sign-in
- ✅ Account linking (link multiple providers to one account)
- ✅ Secure JWT token management with HttpOnly cookies
- ✅ User profile picture and name synchronization
- ✅ Fallback email validation and username generation

---

## Architecture

### Backend Flow

```
User clicks OAuth button
        ↓
Frontend fetches Client ID from backend
        ↓
Frontend redirects to OAuth provider
        ↓
User authenticates with provider
        ↓
Provider redirects to callback endpoint with code/ID token
        ↓
Backend validates token and exchanges code if needed
        ↓
Backend creates/updates user and OAuth account in database
        ↓
Backend generates JWT tokens and sets HttpOnly cookies
        ↓
Frontend updates auth context and redirects to dashboard
```

### Database Schema

```
Users Table
├── id (UUID primary key)
├── email (unique)
├── username (unique)
├── full_name
├── hashed_password
├── is_active
└── created_at

OAuthAccounts Table (many-to-one relationship with Users)
├── id (UUID primary key)
├── user_id (foreign key to Users)
├── provider (google | microsoft | apple)
├── provider_user_id (unique per provider)
├── email
├── name
├── picture_url
├── access_token
├── refresh_token
├── token_expires_at
└── created_at
```

---

## Setup Instructions

### 1. Google OAuth Setup

#### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     ```
     http://localhost:8000/api/v1/auth/google/callback
     https://your-domain.com/api/v1/auth/google/callback
     ```
   - Copy the **Client ID** and **Client Secret**

#### Add to Environment

Update `/backend/.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id-from-google-console
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

---

### 2. Microsoft OAuth Setup

#### Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Configure:
   - Name: "Cognitest"
   - Supported account types: "Accounts in any organizational directory"
   - Redirect URI: Web → `http://localhost:8000/api/v1/auth/microsoft/callback`
5. Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the value (you won't see it again)
6. Go to "API permissions"
   - Add Microsoft Graph permissions:
     - `email`
     - `profile`
     - `openid`

#### Add to Environment

Update `/backend/.env`:

```bash
MICROSOFT_CLIENT_ID=your-client-id-from-azure
MICROSOFT_CLIENT_SECRET=your-client-secret-from-azure
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/auth/microsoft/callback
```

---

### 3. Apple OAuth Setup

#### Create Apple App ID

1. Go to [Apple Developer Account](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Go to "Identifiers" section
4. Create a new App ID:
   - Type: App IDs
   - Description: "Cognitest"
   - Check "Sign in with Apple"
5. Configure the Service ID:
   - Create a Service ID for web usage
   - Configure "Return URLs":
     ```
     http://localhost:8000/api/v1/auth/apple/callback
     https://your-domain.com/api/v1/auth/apple/callback
     ```
6. Create a private key:
   - Go to "Keys" section
   - Create new key with "Sign in with Apple"
   - Download the `.p8` file and save securely

#### Add to Environment

Update `/backend/.env`:

```bash
APPLE_CLIENT_ID=your-service-id
APPLE_CLIENT_SECRET=your-generated-jwt-secret
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/apple/callback
```

---

## Configuration

### Environment Variables Reference

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=                    # Your Google Client ID
GOOGLE_CLIENT_SECRET=                # Your Google Client Secret
GOOGLE_REDIRECT_URI=                 # Redirect URI (must match Google Console)
```

#### Microsoft OAuth
```bash
MICROSOFT_CLIENT_ID=                 # Your Azure App Client ID
MICROSOFT_CLIENT_SECRET=             # Your Azure App Client Secret
MICROSOFT_REDIRECT_URI=              # Redirect URI (must match Azure Portal)
```

#### Apple OAuth
```bash
APPLE_CLIENT_ID=                     # Apple Service ID
APPLE_CLIENT_SECRET=                 # Apple Client Secret (JWT)
APPLE_TEAM_ID=                       # Apple Team ID
APPLE_KEY_ID=                        # Apple Key ID
APPLE_REDIRECT_URI=                  # Redirect URI (must match Apple Developer)
```

### Backend Configuration (app/core/config.py)

All OAuth settings are automatically loaded from environment variables via Pydantic.

```python
# Google OAuth
GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "...")

# Microsoft OAuth
MICROSOFT_CLIENT_ID: str = os.getenv("MICROSOFT_CLIENT_ID", "")
MICROSOFT_CLIENT_SECRET: str = os.getenv("MICROSOFT_CLIENT_SECRET", "")
MICROSOFT_REDIRECT_URI: str = os.getenv("MICROSOFT_REDIRECT_URI", "...")

# Apple OAuth
APPLE_CLIENT_ID: str = os.getenv("APPLE_CLIENT_ID", "")
APPLE_CLIENT_SECRET: str = os.getenv("APPLE_CLIENT_SECRET", "")
APPLE_TEAM_ID: str = os.getenv("APPLE_TEAM_ID", "")
APPLE_KEY_ID: str = os.getenv("APPLE_KEY_ID", "")
APPLE_REDIRECT_URI: str = os.getenv("APPLE_REDIRECT_URI", "...")
```

---

## API Endpoints

### Google OAuth Endpoints

#### GET `/api/v1/auth/google/authorize`
Get authorization URL and state token.

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-string"
}
```

#### POST `/api/v1/auth/google/callback`
Handle OAuth callback with authorization code.

**Request:**
```json
{
  "code": "authorization-code-from-google",
  "state": "state-token"
}
```

**Response:**
```json
{
  "message": "Successfully signed in with Google",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "full_name": "User Name"
  }
}
```

#### POST `/api/v1/auth/google/signin`
Sign in with Google ID token (frontend flow).

**Request:**
```json
{
  "id_token": "jwt-id-token-from-google",
  "access_token": "optional-access-token"
}
```

**Response:**
```json
{
  "message": "Successfully signed in with Google",
  "user": { ... }
}
```

#### GET `/api/v1/auth/google/client-id`
Get Google Client ID for frontend initialization.

**Response:**
```json
{
  "client_id": "your-client-id.apps.googleusercontent.com"
}
```

### Microsoft OAuth Endpoints

Same structure as Google OAuth, but use:
- `POST /api/v1/auth/microsoft/callback`
- `POST /api/v1/auth/microsoft/signin`
- `GET /api/v1/auth/microsoft/authorize`
- `GET /api/v1/auth/microsoft/client-id`

### Apple OAuth Endpoints

Same structure as Google OAuth, but use:
- `POST /api/v1/auth/apple/callback`
- `POST /api/v1/auth/apple/signin`
- `GET /api/v1/auth/apple/authorize`
- `GET /api/v1/auth/apple/client-id`

### Account Linking Endpoints

#### GET `/api/v1/auth/linked-accounts`
Get all OAuth accounts linked to current user.

**Response:**
```json
[
  {
    "provider": "google",
    "email": "user@gmail.com",
    "name": "User Name",
    "picture_url": "https://...",
    "linked_at": "2024-01-15T10:30:00Z"
  },
  {
    "provider": "microsoft",
    "email": "user@outlook.com",
    "name": "User Name",
    "picture_url": null,
    "linked_at": "2024-01-16T14:20:00Z"
  }
]
```

#### POST `/api/v1/auth/unlink-account`
Unlink an OAuth provider from current user.

**Request:**
```json
{
  "provider": "google"
}
```

**Response:**
```json
{
  "message": "Google account unlinked successfully"
}
```

**Error Response (409 Conflict):**
```json
{
  "detail": "Cannot unlink last authentication method. Set a password first."
}
```

#### POST `/api/v1/auth/link-account`
Link a new OAuth account to current user (internal use).

**Request:**
```json
{
  "provider": "microsoft",
  "id_token": "jwt-id-token"
}
```

**Response:**
```json
{
  "message": "Microsoft account linked successfully"
}
```

---

## Frontend Components

### OAuth Button Component

`components/auth/oauth-button.tsx` - Generic reusable OAuth button.

```tsx
import { OAuthButton } from '@/components/auth/oauth-button'

<OAuthButton
  provider="google"
  onClick={handleGoogleSignIn}
  isLoading={isLoading}
  variant="default"  // 'default' | 'outline' | 'minimal'
  size="md"         // 'sm' | 'md' | 'lg'
/>
```

### Provider-Specific Buttons

#### Google Sign-In Button

```tsx
import { GoogleSignInButton } from '@/components/auth/google-signin-button'

<GoogleSignInButton
  variant="default"
  size="md"
  onSuccess={(userData) => console.log(userData)}
  onError={(error) => console.error(error)}
/>
```

#### Microsoft Sign-In Button

```tsx
import { MicrosoftSignInButton } from '@/components/auth/microsoft-signin-button'

<MicrosoftSignInButton
  variant="default"
  size="md"
/>
```

#### Apple Sign-In Button

```tsx
import { AppleSignInButton } from '@/components/auth/apple-signin-button'

<AppleSignInButton
  variant="default"
  size="md"
/>
```

### OAuth Providers Component

Display all three providers at once:

```tsx
import { OAuthProvidersFullWidth } from '@/components/auth/oauth-providers'

<OAuthProvidersFullWidth
  onSuccess={(provider, userData) => {
    console.log(`Signed in with ${provider}`)
  }}
/>
```

Or in a grid (3 columns):

```tsx
import { OAuthProviders } from '@/components/auth/oauth-providers'

<OAuthProviders
  variant="default"
  size="md"
/>
```

---

## Account Linking

### Frontend Usage

```tsx
import { OAuthAccountLinking } from '@/components/account/oauth-account-linking'

<OAuthAccountLinking
  userId={currentUser.id}
  onLinkSuccess={(provider) => {
    console.log(`${provider} linked successfully`)
  }}
/>
```

### Features

- **View linked accounts** - See all connected OAuth providers
- **Link new account** - Connect additional OAuth providers
- **Unlink account** - Disconnect OAuth providers (with safety checks)
- **Profile info** - Display email, name, and profile picture

### Safety Features

- Cannot unlink if it's the last authentication method (user must set password first)
- Prevents linking same account to multiple users
- Automatic profile info updates on re-linking

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "detail": "Google OAuth is not configured"
}
```
**Solution:** Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

#### 401 Unauthorized
```json
{
  "detail": "Google OAuth error: Failed to exchange code for token"
}
```
**Solution:** Check if redirect URI matches in OAuth provider settings

#### 404 Not Found
```json
{
  "detail": "Google account not linked. Please sign up first."
}
```
**Solution:** User doesn't have an existing account - they must sign up first

#### 409 Conflict
```json
{
  "detail": "This Google account is already linked to another user"
}
```
**Solution:** User tried to link an OAuth account that's already connected to another Cognitest account

### Frontend Error Handling

All buttons automatically handle errors and display toast notifications:

```tsx
<GoogleSignInButton
  onError={(error) => {
    // error.response?.data?.detail contains API error message
    console.error(error.message)
  }}
/>
```

---

## Testing

### Local Development Setup

1. **Start backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

2. **Start frontend:**
```bash
cd frontend
npm run dev
```

3. **Test URLs:**
   - Sign in: http://localhost:3000/auth/signin
   - Sign up: http://localhost:3000/auth/signup

### Testing Sign-In Flow

1. Navigate to sign-in page
2. Click "Continue with Google/Microsoft/Apple"
3. Authenticate with test account
4. Verify redirect to dashboard
5. Check browser DevTools:
   - **Cookies tab:** Verify `access_token` and `refresh_token` HttpOnly cookies
   - **Network tab:** Verify `/api/v1/auth/me` returns user info

### Testing Account Linking

1. Sign in with Google
2. Go to Account Settings
3. Click "Link Microsoft Account"
4. Authenticate with Microsoft account
5. Verify account appears in linked accounts list

### Testing Error Cases

```bash
# Test missing client ID
curl http://localhost:8000/api/v1/auth/google/client-id

# Test invalid token
curl -X POST http://localhost:8000/api/v1/auth/google/signin \
  -H "Content-Type: application/json" \
  -d '{"id_token": "invalid-token"}'
```

---

## Deployment

### Production Environment Variables

Update your production `.env` with actual credentials:

```bash
# Production URLs (HTTPS)
FRONTEND_URL=https://cognitest.com
GOOGLE_REDIRECT_URI=https://cognitest.com/api/v1/auth/google/callback
MICROSOFT_REDIRECT_URI=https://cognitest.com/api/v1/auth/microsoft/callback
APPLE_REDIRECT_URI=https://cognitest.com/api/v1/auth/apple/callback

# OAuth Credentials
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...
APPLE_TEAM_ID=...
APPLE_KEY_ID=...
```

### OAuth Provider Configuration

Update your OAuth provider settings to include production URLs:

#### Google Console
- Add redirect URI: `https://cognitest.com/api/v1/auth/google/callback`

#### Azure Portal
- Add redirect URI: `https://cognitest.com/api/v1/auth/microsoft/callback`

#### Apple Developer
- Add return URL: `https://cognitest.com/api/v1/auth/apple/callback`

### Security Checklist

- [ ] Use strong `SECRET_KEY` (not the development one)
- [ ] Enable HTTPS for all domains
- [ ] Verify all redirect URIs are HTTPS
- [ ] Store secrets in a secure vault (not in git)
- [ ] Enable CORS only for your domain
- [ ] Rotate OAuth credentials regularly
- [ ] Monitor failed authentication attempts
- [ ] Keep dependencies updated

---

## Troubleshooting

### "Google OAuth is not configured"

**Error:** `{"detail": "Google OAuth is not configured"}`

**Cause:** `GOOGLE_CLIENT_ID` is not set in backend `.env`

**Solution:**
1. Get credentials from Google Cloud Console
2. Add to `/backend/.env`:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
3. Restart backend server

### "Failed to exchange code for token"

**Error:** `{"detail": "Google OAuth error: Failed to exchange code for token"}`

**Causes:**
- Redirect URI doesn't match in Google Console
- Invalid/expired authorization code
- Network connectivity issue

**Solution:**
1. Verify redirect URI in Google Cloud Console matches:
   ```
   http://localhost:8000/api/v1/auth/google/callback
   ```
2. Check backend logs for detailed error
3. Ensure backend can reach `oauth2.googleapis.com`

### "Google Sign-In library not available"

**Error:** Google popup doesn't appear, console shows library not loaded

**Causes:**
- Browser blocked Google script
- CORS issue

**Solution:**
1. Check browser console for CORS errors
2. Disable ad blocker
3. Clear browser cache
4. Check DevTools Network tab - ensure Google SDK loads

### "Cannot unlink last authentication method"

**Error:** `{"detail": "Cannot unlink last authentication method. Set a password first."}`

**Cause:** User created account via OAuth without setting a password

**Solution:**
1. Go to Account Settings
2. Click "Change Password"
3. Set a new password
4. Now can unlink OAuth provider

### Tokens not being set as cookies

**Error:** No `access_token` or `refresh_token` cookies in DevTools

**Causes:**
- Secure flag set but using HTTP (dev only)
- SameSite=Strict blocking cookies
- CORS issue

**Solution:**
1. In development, ensure using `http://` not `https://`
2. Check backend `/cors.py` configuration
3. Verify frontend origin matches CORS_ORIGINS

### Account linking fails with 409 Conflict

**Error:** `{"detail": "This Google account is already linked to another user"}`

**Cause:** User tried to link an OAuth account that's already connected to different Cognitest account

**Solution:**
1. User must use a different OAuth account
2. Or unlink from the other Cognitest account first

### Microsoft claims contain no email

**Error:** Microsoft returns user ID but no email

**Cause:** User account doesn't have email permission

**Solution:**
1. Update Azure App "API permissions"
2. Add "email" scope
3. Ask user to re-authenticate

### Apple "user" not returned on re-login

**Error:** Can't get user name on subsequent sign-ins

**Cause:** Apple only returns user info on first sign-in

**Solution:**
1. Store user info in OAuth account on first sign-in (already done)
2. On subsequent logins, use stored name
3. This is expected behavior from Apple

---

## Reference

### Files Modified

**Backend:**
- `app/utils/google_oauth.py` - Google OAuth utilities
- `app/utils/microsoft_oauth.py` - Microsoft OAuth utilities (new)
- `app/utils/apple_oauth.py` - Apple OAuth utilities (new)
- `app/api/v1/auth.py` - Auth endpoints (updated)
- `app/core/config.py` - Configuration (updated)
- `app/models/oauth_account.py` - OAuth account model

**Frontend:**
- `components/auth/oauth-button.tsx` - Generic OAuth button (new)
- `components/auth/google-signin-button.tsx` - Google button
- `components/auth/microsoft-signin-button.tsx` - Microsoft button (new)
- `components/auth/apple-signin-button.tsx` - Apple button (new)
- `components/auth/oauth-providers.tsx` - Multi-provider component (new)
- `components/account/oauth-account-linking.tsx` - Account linking UI (new)
- `app/auth/signin/page.tsx` - Sign-in page (updated)
- `app/auth/signup/page.tsx` - Sign-up page (updated)
- `lib/google-oauth.ts` - Frontend OAuth utilities (updated)

### Related Documentation

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Apple Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [OpenID Connect](https://openid.net/connect/)

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs: `docker logs cognitest-backend`
3. Check frontend console: DevTools → Console tab
4. Review network requests: DevTools → Network tab
5. Check OAuth provider's dashboard for failed attempts

---

**Last Updated:** 2024-11-01
**Version:** 1.0.0
**Status:** Production Ready

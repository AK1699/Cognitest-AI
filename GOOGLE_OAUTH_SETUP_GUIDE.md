# Google OAuth 2.0 Setup Guide for CogniTest

This guide explains how to set up and use Google OAuth for signup and signin in the CogniTest application.

## Implementation Summary

The following has been implemented:

### Backend Components
- **OAuth Model**: `OAuthAccount` model to store OAuth provider information
- **Google OAuth Service**: `google_oauth.py` utility for handling OAuth flow
- **API Endpoints**: New endpoints for Google OAuth integration
- **Database Schema**: New `oauth_accounts` table

### Frontend Components
- **Google OAuth Utilities**: `lib/google-oauth.ts` for frontend OAuth handling
- **Google Sign-In Button**: Reusable component for Google authentication
- **Integration**: Updated signin/signup pages with Google SSO

## Setup Instructions

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/google/callback` (for local development)
   - `http://localhost:3000/auth/signin` (frontend)
   - Your production URLs when deploying
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Backend Environment Variables

Update `/backend/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

### Step 3: Set Up Database

Run migrations to create the `oauth_accounts` table:

```bash
cd /Applications/TestingHub/testingHub/Cognitest-AI/backend
alembic upgrade head
```

If Alembic is not configured, you can manually create the table by running the SQL:

```sql
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    picture_url VARCHAR(500),
    access_token VARCHAR(1000),
    refresh_token VARCHAR(1000),
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_created_at ON oauth_accounts(created_at);
```

### Step 4: Start the Backend

```bash
cd /Applications/TestingHub/testingHub/Cognitest-AI/backend
python -m pip install -r requirements.txt  # If not already installed
uvicorn app.main:app --reload
```

### Step 5: Start the Frontend

```bash
cd /Applications/TestingHub/testingHub/Cognitest-AI/frontend
npm install  # If not already installed
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Get Google Client ID
```
GET /api/v1/auth/google/client-id
```
Returns the Google Client ID needed for frontend initialization.

### Google Authorization
```
GET /api/v1/auth/google/authorize
```
Returns the authorization URL and state for initiating the OAuth flow.

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-string"
}
```

### Google Callback
```
POST /api/v1/auth/google/callback
Content-Type: application/json

{
  "code": "authorization-code-from-google",
  "state": "state-from-authorization-url"
}
```

Handles the OAuth callback, creates/updates user and OAuth account, returns JWT tokens.

### Google Sign-In
```
POST /api/v1/auth/google/signin
Content-Type: application/json

{
  "id_token": "google-id-token",
  "access_token": "optional-access-token"
}
```

Signs in an existing user with Google credentials.

### Google Sign-Up
```
POST /api/v1/auth/google/signup
Content-Type: application/json

{
  "id_token": "google-id-token",
  "username": "optional-username",
  "access_token": "optional-access-token"
}
```

Creates a new account and signs in with Google credentials.

## Frontend Usage

### Using the Google Sign-In Button

The `GoogleSignInButton` component is a drop-in replacement for the OAuth flow:

```tsx
import { GoogleSignInButton } from '@/components/auth/google-signin-button'

export function MyAuthPage() {
  return (
    <GoogleSignInButton
      onSuccess={(userData) => {
        console.log('User signed in:', userData)
      }}
      onError={(error) => {
        console.error('Sign-in failed:', error)
      }}
    />
  )
}
```

### Manual Google OAuth Integration

For more control, use the utility functions:

```tsx
import {
  loadGoogleScript,
  getGoogleClientId,
  initializeGoogleSignIn,
  handleGoogleSignIn
} from '@/lib/google-oauth'

// Load the Google Sign-In script
await loadGoogleScript()

// Get the client ID from backend
const clientId = await getGoogleClientId()

// Initialize Google Sign-In
initializeGoogleSignIn(clientId, async (response) => {
  // Handle the response
  const result = await handleGoogleSignIn(response.credential)
  console.log('Signed in as:', result.user)
})
```

## Testing

### Manual Testing Flow

1. **Start both servers** (backend on 8000, frontend on 3000)
2. **Navigate to sign-up page**: `http://localhost:3000/auth/signup`
3. **Click the Google Sign-In button**
4. **Authenticate with your Google account**
5. **Verify user is created and logged in**

### Testing Sign-Up
1. Use a Google account you haven't signed up with before
2. The system will auto-create a user account
3. Username will be auto-generated from email

### Testing Sign-In
1. Sign in to an existing account via Google
2. The system will link the Google OAuth account to existing user

### API Testing with cURL

Get Client ID:
```bash
curl http://localhost:8000/api/v1/auth/google/client-id
```

Simulate callback:
```bash
curl -X POST http://localhost:8000/api/v1/auth/google/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test-code",
    "state": "test-state"
  }'
```

## Troubleshooting

### Issue: "Google OAuth is not configured"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the backend server after updating `.env`

### Issue: "Invalid Client ID"
- Verify the Client ID from Google Cloud Console
- Ensure the redirect URI in Google Console matches `GOOGLE_REDIRECT_URI`

### Issue: "oauth_accounts table not found"
- Run database migrations using Alembic
- Or manually create the table using the SQL provided above

### Issue: Google Sign-In button not appearing
- Check that Google Script is loading: `https://accounts.google.com/gsi/client`
- Verify `NEXT_PUBLIC_API_URL` is correctly set in frontend `.env`
- Check browser console for JavaScript errors

### Issue: CORS errors
- Ensure frontend URL is added to CORS_ORIGINS in backend config
- Update `CORS_ORIGINS` in `app/core/config.py` or via environment variable

## Security Considerations

1. **Never commit credentials**: Keep `.env` files out of version control
2. **Use HTTPS in production**: Set `secure=True` in cookie settings
3. **Validate tokens**: Always verify Google tokens on the backend
4. **Rate limiting**: Consider adding rate limiting to OAuth endpoints
5. **CSRF protection**: The `state` parameter prevents CSRF attacks
6. **Token storage**: Access tokens are stored in HttpOnly cookies (XSS protection)

## Next Steps

To add more OAuth providers (Microsoft, Apple, GitHub):

1. Create similar OAuth utility modules
2. Add new model for storing provider-specific data
3. Implement provider-specific endpoints
4. Create provider-specific button components
5. Add provider configuration to environment

## File Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   └── auth.py (updated with Google OAuth endpoints)
│   ├── models/
│   │   ├── user.py (updated with oauth_accounts relationship)
│   │   └── oauth_account.py (new)
│   ├── schemas/
│   │   └── oauth.py (new)
│   ├── utils/
│   │   └── google_oauth.py (new)
│   └── core/
│       └── config.py (updated with Google OAuth config)
└── requirements.txt (updated with google-auth libraries)

frontend/
├── lib/
│   └── google-oauth.ts (new)
├── components/auth/
│   └── google-signin-button.tsx (new)
├── app/auth/
│   ├── signin/page.tsx (updated)
│   └── signup/page.tsx (updated)
└── .env (already configured)
```

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)

# OAuth Testing Guide

Complete guide for testing Google, Microsoft, and Apple OAuth implementation in Cognitest.

---

## 🚀 Quick Testing Setup (5 minutes)

### Prerequisites
- Backend running: `cd backend && uvicorn app.main:app --reload`
- Frontend running: `cd frontend && npm run dev`
- OAuth credentials configured in `/backend/.env`

### Test URLs
- **Sign In:** http://localhost:3000/auth/signin
- **Sign Up:** http://localhost:3000/auth/signup
- **Dashboard:** http://localhost:3000/dashboard

---

## 🔧 Setting Up Test Accounts

### Google Test Account
1. Use your existing Google account or create a new one
2. Email: `yourname+googletest@gmail.com` (Gmail allows aliases)
3. No additional setup needed - ready to test immediately

### Microsoft Test Account
1. Go to https://outlook.live.com/
2. Create a free account (yourname@outlook.com)
3. Use this account to test Microsoft OAuth

### Apple Test Account
1. Go to https://appleid.apple.com/
2. Create an Apple ID (use fake email: test+apple@example.com)
3. Or use existing Apple ID if you have one

---

## ✅ Test Scenarios

### Scenario 1: Basic Sign-In Flow

#### Test Google Sign-In
1. Open http://localhost:3000/auth/signin
2. Click "Continue with Google"
3. Google login popup appears
4. Enter Google credentials
5. Popup closes
6. **Expected:** Redirected to dashboard
7. **Verify in DevTools:**
   - Application → Cookies → Check `access_token` and `refresh_token`
   - Both should be HttpOnly (cannot access via JavaScript)

#### Test Microsoft Sign-In
1. Open http://localhost:3000/auth/signin
2. Click "Continue with Microsoft"
3. Redirects to Microsoft login
4. Enter Microsoft credentials
5. **Expected:** Redirected back to callback endpoint, then to dashboard
6. **Verify:** Same cookies as Google test

#### Test Apple Sign-In
1. Open http://localhost:3000/auth/signin
2. Click "Continue with Apple"
3. Redirects to Apple login
4. Enter Apple ID credentials
5. Approve request
6. **Expected:** Redirected to dashboard
7. **Verify:** Same cookies set

---

### Scenario 2: Sign-Up Flow

#### Test New User Sign-Up
1. Open http://localhost:3000/auth/signup
2. Click "Continue with Google"
3. Sign in with a NEW Google account you haven't used before
4. **Expected:**
   - New user account created automatically
   - Redirected to dashboard
   - User appears in database

#### Verify User Created
```bash
# Check database for new user
psql -U akash -d cognitest

# List new users
SELECT id, email, username, full_name, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

# Check OAuth account
SELECT * FROM oauth_accounts
ORDER BY created_at DESC
LIMIT 5;
```

---

### Scenario 3: Account Linking (When Available)

#### Test Linking Multiple Providers

1. **Sign in with Google:**
   - Visit http://localhost:3000/auth/signin
   - Click "Continue with Google"
   - Sign in with your Google account
   - Redirect to dashboard

2. **Link Microsoft account:**
   - Go to Account Settings (if available)
   - Find "Connected Accounts" or "Link Account"
   - Click "Link Microsoft"
   - Sign in with Microsoft account
   - **Expected:** Both accounts now linked

3. **Verify in database:**
```bash
psql -U akash -d cognitest

# Find your user
SELECT id FROM users WHERE email = 'your-email@gmail.com';

# Check linked OAuth accounts
SELECT provider, email, created_at FROM oauth_accounts
WHERE user_id = 'your-user-id';

# Should show both google and microsoft entries
```

4. **Test unlinking:**
   - From Account Settings
   - Click "Unlink" next to Microsoft account
   - **Expected:** Microsoft account removed
   - Google account still active

---

### Scenario 4: Error Cases

#### Test Missing Credentials

1. **Stop backend and delete credentials from `.env`:**
```bash
# Edit /backend/.env - comment out or remove:
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

2. **Restart backend**

3. **Try to sign in:**
   - Click OAuth button
   - **Expected Error:** "Google OAuth is not configured"

4. **Fix and restart backend**

#### Test Invalid Credentials

1. **Edit `.env` with fake credentials:**
```bash
GOOGLE_CLIENT_ID=fake-id-1234567890
GOOGLE_CLIENT_SECRET=fake-secret-abcdefgh
```

2. **Restart backend**

3. **Try to sign in:**
   - Click OAuth button
   - Authenticate with real Google account
   - **Expected:** Error after callback: "Failed to exchange code for token"

#### Test Wrong Redirect URI

1. **In Google Cloud Console**, change redirect URI to:
   ```
   http://localhost:3000/oauth/callback
   ```

2. **Try to sign in:**
   - **Expected:** Redirect URI mismatch error from Google

#### Test Duplicate Account Link

1. **Create two Cognitest accounts:**
   - Account A: Sign up with Google (google@example.com)
   - Account B: Sign up with Microsoft

2. **From Account B, try to link the Google account used for Account A:**
   - Go to Account Settings
   - Click "Link Google"
   - Sign in with google@example.com
   - **Expected Error:** "This Google account is already linked to another user"

---

## 🛠️ Manual Testing with Browser DevTools

### Check JWT Tokens

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Cookies section → localhost:3000**
4. **Look for:**
   - `access_token` - Should be HttpOnly (greyed out)
   - `refresh_token` - Should be HttpOnly (greyed out)
   - Both should have `Secure` flag (false in dev, true in prod)
   - Both should have `SameSite=Lax`

### Decode JWT Token

1. **In browser console:**
```javascript
// Get cookies (for reference)
document.cookie  // Shows only non-HttpOnly cookies

// Can't directly access HttpOnly cookies, but you can see them in DevTools
```

2. **Use JWT.io to decode:**
   - Go to https://jwt.io/
   - Copy token value from DevTools
   - Paste in "Encoded" box on jwt.io
   - **Look for:**
     - `sub` - User ID
     - `email` - User email
     - `exp` - Expiration time

### Check Network Requests

1. **Open Network tab (F12 → Network)**
2. **Sign in with OAuth**
3. **Look for requests:**
   - `google/client-id` - GET request
   - `google/signin` or `microsoft/signin` - POST request
   - `me` - GET request (fetch current user)

4. **Check response status:**
   - All should be 200 or 201
   - Look at response body for error messages

### Check Browser Console

1. **Open Console tab (F12 → Console)**
2. **Sign in with OAuth**
3. **Watch for errors:**
   - CORS errors (check backend CORS settings)
   - Network errors (check backend is running)
   - OAuth library errors (check Google SDK loaded)

---

## 📡 Testing with cURL

### Get Google Client ID
```bash
curl http://localhost:8000/api/v1/auth/google/client-id
```

**Expected Response:**
```json
{
  "client_id": "your-client-id.apps.googleusercontent.com"
}
```

### Get Authorization URL
```bash
curl http://localhost:8000/api/v1/auth/google/authorize
```

**Expected Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-string"
}
```

### Test Sign-In with Invalid Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/google/signin \
  -H "Content-Type: application/json" \
  -d '{"id_token": "invalid-token"}' \
  -v
```

**Expected Response:** 500 error with "Failed to decode ID token"

### Get Current User (Requires JWT)
```bash
# First, sign in via browser to get the JWT cookie
# Then use the cookie:

curl http://localhost:8000/api/v1/auth/me \
  -b "access_token=YOUR_JWT_TOKEN_HERE" \
  -v
```

**Expected Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "username",
  "full_name": "User Name",
  "is_active": true,
  "is_superuser": false
}
```

### Test Account Linking
```bash
# Get linked accounts
curl http://localhost:8000/api/v1/auth/linked-accounts \
  -b "access_token=YOUR_JWT_TOKEN" \
  -v

# Unlink account
curl -X POST http://localhost:8000/api/v1/auth/unlink-account \
  -H "Content-Type: application/json" \
  -b "access_token=YOUR_JWT_TOKEN" \
  -d '{"provider": "google"}' \
  -v
```

---

## 🧪 Automated Testing Ideas

### Integration Tests (Pseudocode)

```javascript
describe('OAuth Sign-In', () => {

  test('Google sign-in creates new user', async () => {
    // 1. Get Google client ID
    const clientId = await getGoogleClientId()
    // 2. Simulate Google sign-in
    const idToken = generateTestIdToken('google')
    // 3. Call backend signin endpoint
    const response = await fetch('/api/v1/auth/google/signin', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken })
    })
    // 4. Assert user created
    expect(response.status).toBe(200)
    expect(response.body.user).toBeDefined()
    // 5. Assert cookies set
    expect(getCookie('access_token')).toBeDefined()
  })

  test('Microsoft sign-in fails with invalid token', async () => {
    const response = await fetch('/api/v1/auth/microsoft/signin', {
      method: 'POST',
      body: JSON.stringify({ id_token: 'invalid' })
    })
    expect(response.status).toBe(500)
    expect(response.body.detail).toContain('Failed to decode')
  })

  test('Account linking prevents duplicate', async () => {
    // 1. Create user A with Google
    // 2. Create user B with Microsoft
    // 3. Try to link user B with user A's Google account
    // 4. Assert error: "already linked to another user"
  })
})
```

---

## 📊 Testing Checklist

### Basic Functionality
- [ ] Google sign-in works
- [ ] Microsoft sign-in works
- [ ] Apple sign-in works
- [ ] New users created automatically
- [ ] Existing users can log in again
- [ ] User profile picture loaded (Google)
- [ ] User full name synced

### Security
- [ ] JWT cookies are HttpOnly
- [ ] Cookies have SameSite=Lax
- [ ] State parameter prevents CSRF
- [ ] Invalid tokens rejected
- [ ] Missing credentials handled gracefully
- [ ] Logout clears cookies
- [ ] Expired tokens detected

### Account Linking (if implemented)
- [ ] Can link multiple providers
- [ ] Can view linked accounts
- [ ] Can unlink accounts
- [ ] Cannot unlink last auth method without password
- [ ] Cannot link duplicate accounts to different users

### Error Cases
- [ ] Missing Client ID error
- [ ] Invalid redirect URI error
- [ ] Token exchange failure
- [ ] Network timeout handling
- [ ] Helpful error messages shown

### User Experience
- [ ] No page flicker during sign-in
- [ ] Loading states show while authenticating
- [ ] Error messages are clear
- [ ] Redirect to dashboard after sign-in
- [ ] Can sign out successfully
- [ ] Can sign in again after sign out

### Database
- [ ] Users table has new entry
- [ ] OAuthAccount table linked correctly
- [ ] Multiple OAuth accounts per user work
- [ ] User deletion cascades to OAuth accounts

---

## 🔍 Debugging Tips

### Enable Detailed Logging

**Backend:**
```python
# Add to app/core/config.py
LOG_LEVEL="DEBUG"

# In auth.py, add logging
import logging
logger = logging.getLogger(__name__)

# Before OAuth call:
logger.debug(f"Attempting OAuth with provider: {provider}")
logger.debug(f"Client ID: {settings.GOOGLE_CLIENT_ID}")
```

**Frontend:**
```javascript
// Add to components/auth/google-signin-button.tsx
console.log('Google button clicked')
console.log('Client ID:', clientId)
console.log('OAuth response:', response)
```

### Check Backend Logs

```bash
# See uvicorn logs
cd backend && uvicorn app.main:app --reload

# Will show:
# - OAuth provider calls
# - Token exchange details
# - Database operations
# - Error traces
```

### Check Database

```bash
# Connect to database
psql -U akash -d cognitest

# Check recent users
\d users
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

# Check OAuth accounts
\d oauth_accounts
SELECT * FROM oauth_accounts ORDER BY created_at DESC LIMIT 5;

# Check specific user's OAuth accounts
SELECT * FROM oauth_accounts
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
```

### Browser DevTools Network Tab Analysis

1. **Click OAuth button**
2. **Watch Network requests:**
   - First request: `google/client-id` (GET) - Should be 200
   - Then browser redirects to Google
   - After auth, returns to callback URL
   - `google/signin` or `google/callback` (POST) - Should be 200
   - `me` (GET) - Should be 200
3. **Check response bodies for errors**

---

## 🚨 Common Issues & Solutions

### Issue: "OAuth is not configured"

**Cause:** Missing credentials in `.env`

**Fix:**
```bash
# Edit /backend/.env and verify:
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-secret

# Restart backend:
# Kill current process (Ctrl+C)
# Run again: uvicorn app.main:app --reload
```

### Issue: Google popup doesn't appear

**Causes:**
- Ad blocker blocking Google SDK
- CORS error
- Google script not loaded

**Fix:**
1. Disable ad blocker
2. Check browser console for errors
3. Verify Google SDK loads: DevTools → Network → search "accounts.google.com"

### Issue: Redirect URI mismatch error

**Cause:** Redirect URI in OAuth provider settings doesn't match backend

**Fix:**
1. In Google Cloud Console, verify:
   ```
   http://localhost:8000/api/v1/auth/google/callback
   ```
2. In `.env`, verify:
   ```
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
   ```
3. Both must match EXACTLY

### Issue: Tokens not being set as cookies

**Cause:**
- Secure flag required in production
- CORS blocking cookies
- SameSite policy too strict

**Fix:**
```javascript
// In DevTools → Console, check:
document.domain  // Should be localhost
// Check Application → Cookies for tokens
```

### Issue: "Failed to exchange code for token"

**Causes:**
- Invalid Client Secret
- Expired credentials
- Redirect URI mismatch

**Fix:**
1. Verify Client ID and Secret in Google Cloud Console
2. Regenerate Client Secret if unsure
3. Update `.env` with new secret
4. Restart backend

---

## 📈 Performance Testing

### Load Test Sign-In

```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 http://localhost:8000/api/v1/auth/google/client-id

# Results should show:
# - Response times < 100ms
# - No failed requests
# - Consistent performance
```

### Memory Leaks Check

1. **Open DevTools → Memory**
2. **Take heap snapshot before sign-in**
3. **Sign in and out 10 times**
4. **Take another heap snapshot**
5. **Compare:** Should not grow significantly

---

## 📝 Test Report Template

Use this to document your testing:

```markdown
# OAuth Testing Report

## Test Date: [Date]
## Tester: [Name]

### Sign-In Tests

#### Google Sign-In
- [ ] New user sign-in works
- [ ] Existing user sign-in works
- [ ] Correct redirect to dashboard
- [ ] JWT cookies set correctly
- [ ] User profile synced

#### Microsoft Sign-In
- [ ] New user sign-in works
- [ ] Existing user sign-in works
- [ ] Correct redirect to dashboard
- [ ] JWT cookies set correctly

#### Apple Sign-In
- [ ] New user sign-in works
- [ ] Existing user sign-in works
- [ ] Correct redirect to dashboard
- [ ] JWT cookies set correctly

### Error Cases

#### Missing Credentials
- [ ] Shows "not configured" error
- [ ] Error message clear

#### Invalid Token
- [ ] Shows token validation error
- [ ] Error message clear

### Security Tests

#### Cookie Security
- [ ] access_token is HttpOnly
- [ ] refresh_token is HttpOnly
- [ ] SameSite=Lax set
- [ ] Secure flag set (production only)

#### CSRF Protection
- [ ] State parameter used
- [ ] Invalid state rejected

### Database Tests

#### User Creation
- [ ] New user in users table
- [ ] OAuth account in oauth_accounts table
- [ ] User linked to OAuth account

#### Account Linking
- [ ] Multiple OAuth accounts created
- [ ] All linked to same user
- [ ] Can unlink each account

### Issues Found

1. [Issue 1]
   - Severity: [Critical/High/Medium/Low]
   - Reproduction: [Steps]
   - Solution: [Fix applied or workaround]

### Pass/Fail Summary

- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Status: ✅ PASS or ❌ FAIL
```

---

## ✅ Sign-Off Checklist

When you've tested everything, verify:

- [ ] All three OAuth providers work
- [ ] New users can sign up
- [ ] Existing users can sign in
- [ ] JWT tokens properly set
- [ ] Error messages are helpful
- [ ] Account linking works (if implemented)
- [ ] Database records created correctly
- [ ] No console errors
- [ ] No network errors
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Ready for production

---

## 📞 Getting Help During Testing

1. Check browser console (F12) for errors
2. Check backend logs (terminal running uvicorn)
3. Review `/OAUTH_IMPLEMENTATION_GUIDE.md` → Troubleshooting
4. Check database to verify records created
5. Use cURL to test endpoints directly

---

## 🎓 Learning Through Testing

As you test, you'll learn:
- How OAuth flows work in practice
- How JWT tokens are managed
- How your database is organized
- How to debug authentication issues
- Security best practices

Take time to explore and understand each component!

---

**Remember:** Testing is not just about finding bugs—it's about verifying the system works as expected and understanding how it works.

Good luck testing! 🚀

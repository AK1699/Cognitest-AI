# Google SSO - Troubleshooting Guide

## 🔍 Current Status

Your Google OAuth credentials are configured in `.env`:
- ✅ GOOGLE_CLIENT_ID: `57505885415-...`
- ✅ GOOGLE_CLIENT_SECRET: `GOCSPX-...`
- ✅ GOOGLE_REDIRECT_URI: `http://localhost:8000/api/v1/auth/google/callback`

## ❌ Common Issues & Solutions

---

### Issue 1: Backend Not Running

**Symptom**: Google sign-in button doesn't respond or shows connection error

**Check**:
```bash
curl http://localhost:8000/api/v1/auth/google/client-id
```

**If it fails**, the backend isn't running.

**Solution**:
```bash
cd backend

# Install dependencies first
pip3 install -r requirements.txt

# Start backend
uvicorn app.main:app --reload --port 8000
```

**Verify**:
```bash
# Should return your client ID
curl http://localhost:8000/api/v1/auth/google/client-id
```

---

### Issue 2: Missing Dependencies

**Symptom**: `ModuleNotFoundError: No module named 'pydantic_settings'`

**Solution**:
```bash
cd backend
pip3 install pydantic-settings httpx python-multipart
pip3 install -r requirements.txt
```

---

### Issue 3: Frontend Can't Connect to Backend

**Symptom**: CORS errors or network errors in browser console

**Check frontend .env**:
```bash
# Create/edit frontend/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
```

**Restart frontend**:
```bash
cd frontend
npm run dev
```

---

### Issue 4: Google Redirect URI Mismatch

**Symptom**: Error after clicking Google sign-in: "redirect_uri_mismatch"

**Problem**: Your Google Cloud Console redirect URI doesn't match the one in `.env`

**Solution**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:8000/api/v1/auth/google/callback
   ```
6. Click **Save**

---

### Issue 5: Google OAuth Consent Screen Not Configured

**Symptom**: Error about "OAuth consent screen"

**Solution**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Configure:
   - **User Type**: External (for testing)
   - **App name**: CogniTest
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add test users if in testing mode
5. Save and continue

---

### Issue 6: Frontend Google Script Not Loading

**Symptom**: Button shows but clicking does nothing

**Check browser console** (F12):
```javascript
// Should see Google script loaded
console.log(window.google)
```

**Solution - Update frontend component**:

The current implementation redirects to backend `/google/authorize` endpoint.
This is correct! No changes needed.

---

## 🔧 Step-by-Step Debug Process

### Step 1: Verify Backend is Running
```bash
# Terminal 1
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Test
curl http://localhost:8000/api/v1/auth/google/client-id
```

**Expected output**:
```json
{
  "client_id": "57505885415-jrsrfeou2de7v9og5omr6lfgtnmrht8h.apps.googleusercontent.com"
}
```

### Step 2: Verify Frontend is Running
```bash
cd frontend
npm run dev
```

Navigate to: http://localhost:3000/auth/signin

### Step 3: Test Google OAuth Flow

1. **Click "Continue with Google"**
2. **Check browser console** (F12) for errors
3. **You should be redirected to Google's login page**
4. **After login, redirected back to your app**

### Step 4: Check Network Tab

Open browser DevTools → Network tab:

**Request 1**: `GET /api/v1/auth/google/authorize`
- Status: Should be 200
- Response: `{ "authorization_url": "https://accounts.google.com/..." }`

**Request 2**: Google redirects to `GET /api/v1/auth/google/callback?code=...&state=...`
- Status: Should be 200 or 302 (redirect)
- Creates user session

---

## 🐛 Common Error Messages

### Error: "Invalid client_id"
```
❌ Problem: Google doesn't recognize your client ID
✅ Solution: 
   1. Check GOOGLE_CLIENT_ID in backend/.env
   2. Verify it matches Google Cloud Console
   3. Restart backend
```

### Error: "redirect_uri_mismatch"
```
❌ Problem: Redirect URI doesn't match Google Cloud Console
✅ Solution:
   1. Add http://localhost:8000/api/v1/auth/google/callback
   2. In Google Cloud Console → Credentials
   3. Must match exactly (including http/https, port, path)
```

### Error: "CORS policy"
```
❌ Problem: Frontend can't access backend API
✅ Solution:
   1. Check backend/.env has:
      CORS_ORIGINS=http://localhost:3000
   2. Restart backend
```

### Error: "Failed to get authorization URL"
```
❌ Problem: Backend endpoint not responding
✅ Solution:
   1. Ensure backend is running
   2. Check: curl http://localhost:8000/api/docs
   3. Look for /auth/google/authorize endpoint
```

---

## 🧪 Test Script

Save as `test_google_sso.sh`:

```bash
#!/bin/bash

echo "=== Google SSO Troubleshooting ==="
echo ""

# Test 1: Backend health
echo "1. Testing backend health..."
if curl -s http://localhost:8000/api/docs > /dev/null; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is NOT running"
    echo "   Run: cd backend && uvicorn app.main:app --reload"
    exit 1
fi

# Test 2: Google client ID endpoint
echo ""
echo "2. Testing Google client ID endpoint..."
RESPONSE=$(curl -s http://localhost:8000/api/v1/auth/google/client-id)
if echo "$RESPONSE" | grep -q "client_id"; then
    echo "   ✅ Google client ID endpoint working"
    echo "   Client ID: $(echo $RESPONSE | jq -r .client_id | cut -c1-20)..."
else
    echo "   ❌ Google client ID endpoint failed"
    echo "   Response: $RESPONSE"
fi

# Test 3: Google authorize endpoint
echo ""
echo "3. Testing Google authorize endpoint..."
RESPONSE=$(curl -s http://localhost:8000/api/v1/auth/google/authorize)
if echo "$RESPONSE" | grep -q "authorization_url"; then
    echo "   ✅ Google authorize endpoint working"
else
    echo "   ❌ Google authorize endpoint failed"
    echo "   Response: $RESPONSE"
fi

# Test 4: Frontend health
echo ""
echo "4. Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Frontend is running"
else
    echo "   ❌ Frontend is NOT running"
    echo "   Run: cd frontend && npm run dev"
fi

echo ""
echo "=== Test Complete ==="
```

Run it:
```bash
chmod +x test_google_sso.sh
./test_google_sso.sh
```

---

## 🔐 Security Note

**Important**: The credentials in your `.env` are exposed in this conversation.

**Recommended Action**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Credentials**
3. **Delete** the current OAuth client
4. **Create a new one** with:
   - Authorized redirect URI: `http://localhost:8000/api/v1/auth/google/callback`
5. **Update** your `backend/.env` with new credentials
6. **Never commit** `.env` to version control

---

## ✅ Quick Fix Checklist

- [ ] Backend running (`uvicorn app.main:app --reload`)
- [ ] Frontend running (`npm run dev`)
- [ ] Dependencies installed (`pip3 install -r requirements.txt`)
- [ ] `.env` file has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Google Cloud Console has correct redirect URI
- [ ] OAuth consent screen configured
- [ ] Test users added (if in testing mode)
- [ ] CORS configured (`CORS_ORIGINS=http://localhost:3000`)
- [ ] No browser console errors

---

## 🎯 Most Likely Issues (In Order)

1. **Backend not running** (90% of issues)
   - Solution: `cd backend && uvicorn app.main:app --reload`

2. **Missing dependencies**
   - Solution: `pip3 install -r requirements.txt`

3. **Redirect URI mismatch**
   - Solution: Update Google Cloud Console

4. **CORS issues**
   - Solution: Check `CORS_ORIGINS` in `.env`

5. **OAuth consent screen not configured**
   - Solution: Configure in Google Cloud Console

---

## 📞 Still Not Working?

### Check Backend Logs
```bash
# Backend should show:
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Check Browser Console (F12)
Look for:
- Network errors (red)
- CORS errors
- JavaScript errors

### Test Manually
```bash
# Get authorization URL
curl http://localhost:8000/api/v1/auth/google/authorize

# Copy the authorization_url and paste in browser
# After Google login, check where it redirects
```

---

## 🚀 Quick Start (If Nothing Works)

```bash
# 1. Stop everything
pkill -f uvicorn
pkill -f next

# 2. Clean install backend
cd backend
rm -rf __pycache__ app/__pycache__
pip3 install -r requirements.txt

# 3. Start backend
uvicorn app.main:app --reload --port 8000

# 4. New terminal - start frontend
cd frontend
npm run dev

# 5. Test in browser
# Go to: http://localhost:3000/auth/signin
# Click "Continue with Google"
```

---

## 📋 Environment Variables Reference

### Backend (`backend/.env`)
```env
# Required for Google SSO
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Required for CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Required for frontend
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

**Status**: Ready to debug! Start with Step 1 above.

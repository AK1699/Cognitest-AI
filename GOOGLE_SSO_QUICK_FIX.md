# Google SSO - Quick Fix Guide

## Issue: Backend not responding on port 8000

### Quick Fix:

```bash
# 1. Kill any existing processes
lsof -ti:8000 | xargs kill -9

# 2. Start backend properly
cd backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Keep this terminal open!
```

### Test:
```bash
# In a new terminal
curl http://localhost:8000/api/v1/auth/google/client-id
```

Expected output:
```json
{"client_id":"57505885415-jrsrfeou2de7v9og5omr6lfgtnmrht8h.apps.googleusercontent.com"}
```

---

## What's the Error You're Seeing?

Please tell me which of these you're experiencing:

### 1. Button doesn't do anything
- Click "Continue with Google" → Nothing happens
- Check browser console (F12) for errors

### 2. Error message appears
- What does the error say?
- Screenshot would help

### 3. Redirects to Google but fails
- Gets to Google login page?
- Error after entering credentials?
- Error on redirect back?

### 4. Other issue
- Describe what happens when you click the button

---

## Debug Steps:

### Step 1: Check Backend
```bash
curl http://localhost:8000/api/v1/auth/google/client-id
```

### Step 2: Check Frontend
Open browser to: http://localhost:3000/auth/signin

### Step 3: Open Browser Console
Press F12, go to Console tab, click "Continue with Google", check for errors

### Step 4: Check Network Tab
F12 → Network tab → Click button → See what request fails

---

## Common Issues:

### Issue: "Failed to get authorization URL"
**Fix**: Backend not running or not accessible

### Issue: "redirect_uri_mismatch" 
**Fix**: Update Google Cloud Console with: `http://localhost:8000/api/v1/auth/google/callback`

### Issue: CORS error
**Fix**: Check `backend/.env` has `CORS_ORIGINS=http://localhost:3000`

---

## Tell me what you see and I'll help fix it!

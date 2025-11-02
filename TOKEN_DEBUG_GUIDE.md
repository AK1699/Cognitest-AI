# Token Authentication Debug Guide

## 🔍 Debugging the 401 Error

You're getting a `401 Unauthorized` error which means the token is either missing or invalid. Let's debug this step by step.

---

## 📋 Step 1: Check if Token Exists

### In Browser Console:

```javascript
// Press F12 to open DevTools
// Go to Console tab
// Paste this:

console.log('=== TOKEN DEBUG ===')
console.log('localStorage.access_token:', localStorage.getItem('access_token'))
console.log('document.cookie:', document.cookie)

// Check if access_token cookie exists
const cookies = document.cookie.split(';')
cookies.forEach(c => console.log('Cookie:', c.trim()))
```

### Expected Output:

You should see ONE of these:
- ✅ `localStorage.access_token: eyJhbGc...` (long JWT token)
- ✅ `Cookie: access_token=eyJhbGc...` (token in cookie)
- ❌ `localStorage.access_token: null` (no token)

---

## 🆘 If You See `null` for Both

This means **you're not logged in**. Solution:

```
1. Go to http://localhost:3000
2. Click "Logout" (if visible)
3. Clear all browser data:
   - F12 → Application → Clear all
4. Refresh http://localhost:3000
5. Login with your credentials
6. Wait for redirect to complete
7. Check browser console again for token
8. Go back to test-management page
```

---

## 🔧 Step 2: Check the Network Request

### In Browser DevTools:

```
1. Open DevTools (F12)
2. Go to Network tab
3. Try to load test plans/suites/cases
4. Look for failed request (red status code)
5. Click on it
6. Go to "Request Headers" tab
7. Look for: Authorization: Bearer <token>
8. Copy the token and check if it looks valid
```

### Valid Token Format:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NzRhYWU1ZS1mMzUzLTRlMDMtODFjNy1iMTUzYzZlODZiYzIiLCJlbWFpbCI6Imtzc2FrYXNoMTY5OUBnbWFpbC5jb20iLCJleHAiOjE3NjEwNDY4NjEsInR5cGUiOiJhY2Nlc3MifQ.V0epj9B3hfm0sS9IfJ06r2_eH02cRAHrouZye73U6xY
```

---

## 📊 Step 3: Check API Console Logs

The code now has debug logging. Check your browser console:

```
[Auth] Token found: eyJhbGciOiJIUzI1NiIs...
[testCasesAPI.list] Token: Present URL: http://localhost:8000/api/v1/test-cases/?project_id=...
```

Or if missing:

```
[Auth] No token found in localStorage or cookies
[testCasesAPI.list] Token: Missing URL: http://localhost:8000/api/v1/test-cases/?project_id=...
```

---

## ✅ Step 4: Verify Backend is Running

```bash
# In terminal, check if backend is accessible
curl -i http://localhost:8000/health

# Should return:
# HTTP/1.1 200 OK
```

If not, start backend:
```bash
cd backend
uvicorn app.main:app --reload
```

---

## 🔐 Step 5: Test Token Directly

If you have a token, test it directly:

```bash
# Copy your token from localStorage or cookies
TOKEN="your-token-here"
PROJECT_ID="43080958-325e-4536-b321-27f460e36eec"

# Test the API with your token
curl -i "http://localhost:8000/api/v1/test-plans/?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"

# Should return:
# HTTP/1.1 200 OK
# [list of test plans]

# If you get 401, token is invalid or expired
```

---

## 🆘 Common Issues & Solutions

### Issue 1: "No token found in localStorage or cookies"

**Solution:**
```
1. You're not logged in
2. Go to http://localhost:3000
3. Login again
4. Wait for redirect
5. Check browser console: should see token
```

### Issue 2: Token is `null` but I'm logged in

**Solution - Token might be stored with different name:**
```javascript
// Check all localStorage items
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  const value = localStorage.getItem(key)
  console.log(key, ':', value.substring(0, 50))
}

// Check all cookies
console.log(document.cookie)
```

Look for anything that looks like a JWT token (starts with `eyJ...`)

### Issue 3: Token exists but still getting 401

**Solution - Token might be expired:**
```bash
# Tokens expire after 24 hours by default
# Login again to get a fresh token

# Or check token expiry:
# Decode JWT at https://jwt.io
# Look for 'exp' field
```

### Issue 4: Backend returns 401 for valid-looking token

**Solution - Token might not be bound to user:**
```bash
# 1. Make sure user account exists in database
# 2. Verify user has access to the project
# 3. Check backend logs for error details

# Backend logs:
docker logs <backend-container-id>
# or
tail -f app.log
```

---

## 🛠️ Fix Checklist

When you get 401 error, go through this checklist:

```
□ Token exists in localStorage or cookies
  └─ If no: Login again

□ Token is not null
  └─ If null: Clear cache and login

□ Token starts with "eyJ" (JWT format)
  └─ If not: Contact support

□ Token is in Authorization header
  └─ Check Network tab in DevTools

□ Backend is running
  └─ Run: curl http://localhost:8000/health

□ Project ID is correct
  └─ Check URL and verify it exists

□ User has access to project
  └─ Verify in project members list

□ Token is not expired
  └─ Login again if over 24 hours old
```

---

## 📝 Debug Output Example

### Working (Success):

```
Console:
[Auth] Token found: eyJhbGciOiJIUzI1NiIs...
[testCasesAPI.list] Token: Present URL: http://localhost:8000/api/v1/test-cases/?project_id=43080958...

Network:
GET /api/v1/test-cases/?project_id=43080958... HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Status: 200 OK
Response: [{"id": "...", "title": "..."}]
```

### Not Working (401):

```
Console:
[Auth] No token found in localStorage or cookies
[testCasesAPI.list] Token: Missing URL: http://localhost:8000/api/v1/test-cases/?project_id=43080958...

Network:
GET /api/v1/test-cases/?project_id=43080958... HTTP/1.1
Authorization: Bearer null
Status: 401 Unauthorized
Response: {"detail": "Not authenticated"}
```

---

## 🚀 Quick Fix Script

Run this in browser console if you're stuck:

```javascript
// Get token
const token = localStorage.getItem('access_token') ||
              document.cookie.match(/access_token=([^;]+)/)?.[1]

console.log('Token Status:')
console.log('- Found:', !!token)
console.log('- Length:', token?.length)
console.log('- Type:', typeof token)
console.log('- Preview:', token?.substring(0, 50) + '...')

// If no token, redirect to login
if (!token) {
  console.log('No token found. Redirecting to login...')
  window.location.href = 'http://localhost:3000'
}
```

---

## 📞 Still Need Help?

1. Check backend logs for error details
2. Try a fresh login
3. Clear browser cache completely
4. Try incognito/private mode
5. Check if backend is handling token correctly

---

## 🎯 Next Steps After Fixing

Once you see the token in the console and network requests succeed (200 OK):

1. Refresh test-management page
2. You should see Test Plans/Suites/Cases load
3. Try creating a test plan
4. Try generating with AI

Good luck! 🚀

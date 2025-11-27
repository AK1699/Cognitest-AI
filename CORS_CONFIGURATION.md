# CORS Configuration Guide

## Overview
This document explains the CORS (Cross-Origin Resource Sharing) configuration for the Cognitest platform and how to troubleshoot CORS issues.

## Current Configuration

### Backend (FastAPI)
The backend CORS configuration is located in:
- **Config File**: `backend/app/core/config.py`
- **Main Application**: `backend/app/main.py`
- **Environment Variables**: `backend/.env`

### CORS Settings

```python
# CORS Origins are read from environment variable
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
```

**Middleware Configuration:**
- ✅ `allow_origins`: Dynamically loaded from `CORS_ORIGINS` env variable
- ✅ `allow_credentials`: `True` (allows cookies and authentication headers)
- ✅ `allow_methods`: `["*"]` (allows all HTTP methods)
- ✅ `allow_headers`: `["*"]` (allows all request headers)
- ✅ `expose_headers`: `["*"]` (exposes all response headers)
- ✅ `max_age`: `3600` seconds (caches preflight requests for 1 hour)

## Frontend Configuration

### Next.js Rewrites (Recommended Approach)
The frontend uses Next.js rewrites to proxy API requests, which **eliminates CORS issues** during development:

```javascript
// frontend/next.config.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}
```

### Axios Configuration
```typescript
// frontend/lib/axios.ts
const api = axios.create({
  baseURL: '',  // Empty baseURL uses relative URLs
  withCredentials: true,  // Sends cookies with requests
})
```

## How It Works

### Development Flow
1. Frontend makes request to `/api/v1/auth/signin`
2. Next.js intercepts the request (via rewrite rule)
3. Next.js proxies to `http://localhost:8000/api/v1/auth/signin`
4. Backend responds with data and sets cookies
5. No CORS issues because browser thinks it's same-origin

### Production Flow
1. Frontend makes request to `https://api.cognitest.com/api/v1/auth/signin`
2. Browser checks CORS headers
3. Backend returns proper CORS headers based on `CORS_ORIGINS`
4. Browser allows the request if origin is in allowed list

## Configuration Steps

### 1. Backend Setup

**Edit `backend/.env`:**
```env
# For development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

# For production, add your production domains
CORS_ORIGINS=https://cognitest.com,https://www.cognitest.com,https://app.cognitest.com
```

### 2. Verify Configuration

**Check CORS origins are loaded:**
```bash
cd backend
python3 -c "from app.core.config import settings; print(settings.CORS_ORIGINS)"
```

**Start backend and check logs:**
```bash
cd backend
uvicorn app.main:app --reload
```

You should see:
```
🌐 CORS Origins configured: ['http://localhost:3000', 'http://localhost:3001', ...]
```

### 3. Frontend Setup

**No additional configuration needed** - Next.js rewrites handle it automatically.

## Troubleshooting

### Issue 1: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause**: Backend CORS_ORIGINS doesn't include the frontend origin.

**Solution**:
```bash
# Check your frontend URL
echo $FRONTEND_URL

# Update backend/.env to include the origin
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

# Restart backend
```

### Issue 2: "CORS policy: Credentials flag is true, but Access-Control-Allow-Credentials is false"

**Cause**: Backend not configured to allow credentials.

**Solution**: Already fixed - `allow_credentials=True` is set in middleware.

### Issue 3: Cookies not being sent/received

**Causes**:
- Frontend not using `withCredentials: true`
- Backend not setting `SameSite` properly
- Mixed HTTP/HTTPS protocols

**Solutions**:
```typescript
// Already configured in frontend/lib/axios.ts
axios.create({
  withCredentials: true,  // ✅ Already set
})
```

### Issue 4: Preflight (OPTIONS) requests failing

**Cause**: Backend not handling OPTIONS requests properly.

**Solution**: Already fixed - FastAPI's CORSMiddleware handles OPTIONS automatically.

### Issue 5: Different ports causing CORS errors

**Solution**: Add all development ports to CORS_ORIGINS:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001
```

## Testing CORS

### Test 1: Check CORS Headers
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/v1/auth/signin \
     -v
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *
```

### Test 2: Check Configuration at Runtime
```bash
# SSH into backend container or run locally
cd backend
python3 << EOF
from app.core.config import settings
print("CORS Origins:", settings.CORS_ORIGINS)
print("Frontend URL:", settings.FRONTEND_URL)
EOF
```

### Test 3: Browser DevTools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a request to the API
4. Check Response Headers for:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Credentials`
   - `Access-Control-Allow-Methods`

## Production Deployment

### Environment Variables
```env
# Production backend/.env
FRONTEND_URL=https://app.cognitest.com
CORS_ORIGINS=https://cognitest.com,https://www.cognitest.com,https://app.cognitest.com

# If using multiple subdomains
CORS_ORIGINS=https://app.cognitest.com,https://admin.cognitest.com,https://api.cognitest.com
```

### Security Considerations

1. **Never use `allow_origins=["*"]` with `allow_credentials=True`**
   - This is a security risk
   - Current config is safe ✅

2. **Always specify exact origins**
   - ✅ We use explicit origin list
   - ❌ Don't use wildcard origins in production

3. **Use HTTPS in production**
   - Update all origins to use `https://`
   - Configure SSL certificates

4. **SameSite Cookie Attribute**
   - Set to `Lax` or `Strict` in production
   - Configure in `backend/app/core/security.py`

## Quick Fix Checklist

If you're experiencing CORS issues, check:

- [ ] Backend `.env` has `CORS_ORIGINS` variable set
- [ ] Frontend origin (e.g., `http://localhost:3000`) is in `CORS_ORIGINS`
- [ ] Backend service is running and accessible
- [ ] Next.js rewrites are configured (check `next.config.js`)
- [ ] Axios is using `withCredentials: true`
- [ ] Both frontend and backend are using the same protocol (both HTTP or both HTTPS)
- [ ] Browser cache is cleared (Ctrl+Shift+R)
- [ ] Backend logs show: `🌐 CORS Origins configured: [...]`

## Advanced: Dynamic CORS for Multiple Tenants

For multi-tenant deployments where origins are dynamic:

```python
# backend/app/core/config.py
def get_allowed_origins():
    """Fetch allowed origins from database or configuration"""
    base_origins = os.getenv("CORS_ORIGINS", "").split(",")
    # Add dynamic origins from database
    return base_origins

CORS_ORIGINS: List[str] = get_allowed_origins()
```

## Support

If you continue to experience CORS issues:

1. Check backend logs for CORS configuration on startup
2. Use browser DevTools Network tab to inspect request/response headers
3. Test with curl to isolate frontend vs backend issues
4. Verify environment variables are loaded correctly
5. Check for reverse proxy or load balancer CORS configuration

## Summary

✅ **CORS is now properly configured** with:
- Dynamic origin configuration via environment variables
- Full credentials support for authentication
- Proper preflight handling
- Production-ready security settings
- Next.js rewrites for seamless development

🎉 **CORS issues should now be resolved!**

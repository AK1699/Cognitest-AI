# OAuth & Authentication API Reference

Complete API endpoint reference for Cognitest OAuth implementation.

## Base URL
```
http://localhost:8000  (development)
https://api.cognitest.com  (production)
```

## Authentication Endpoints

### Google OAuth

#### GET `/api/v1/auth/google/authorize`
Get authorization URL and state token for OAuth flow.

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
    "email": "user@gmail.com",
    "username": "user",
    "full_name": "User Name"
  }
}
```

**Sets Cookies:**
- `access_token` (HttpOnly, 24 hours)
- `refresh_token` (HttpOnly, 7 days)

#### POST `/api/v1/auth/google/signin`
Sign in with Google ID token (used by frontend Google SDK).

**Request:**
```json
{
  "id_token": "jwt-id-token-from-google",
  "access_token": "optional-access-token"
}
```

**Response:** (same as callback)

#### GET `/api/v1/auth/google/client-id`
Get Google Client ID for frontend initialization.

**Response:**
```json
{
  "client_id": "your-client-id.apps.googleusercontent.com"
}
```

---

### Microsoft OAuth

#### GET `/api/v1/auth/microsoft/authorize`
Get authorization URL for Microsoft OAuth flow.

**Response:**
```json
{
  "authorization_url": "https://login.microsoftonline.com/...",
  "state": "random-state-string"
}
```

#### POST `/api/v1/auth/microsoft/callback`
Handle Microsoft OAuth callback.

**Request:**
```json
{
  "code": "authorization-code-from-microsoft",
  "state": "state-token"
}
```

**Response:**
```json
{
  "message": "Successfully signed in with Microsoft",
  "user": {
    "id": "user-uuid",
    "email": "user@outlook.com",
    "username": "user",
    "full_name": "User Name"
  }
}
```

#### POST `/api/v1/auth/microsoft/signin`
Sign in with Microsoft ID token.

**Request:**
```json
{
  "id_token": "jwt-id-token-from-microsoft",
  "access_token": "optional-access-token"
}
```

#### GET `/api/v1/auth/microsoft/client-id`
Get Microsoft Client ID for frontend.

**Response:**
```json
{
  "client_id": "your-azure-app-client-id"
}
```

---

### Apple OAuth

#### GET `/api/v1/auth/apple/authorize`
Get authorization URL for Sign in with Apple.

**Response:**
```json
{
  "authorization_url": "https://appleid.apple.com/auth/authorize?...",
  "state": "random-state-string"
}
```

#### POST `/api/v1/auth/apple/callback`
Handle Apple OAuth callback.

**Request:**
```json
{
  "code": "authorization-code-from-apple",
  "state": "state-token"
}
```

**Response:**
```json
{
  "message": "Successfully signed in with Apple",
  "user": {
    "id": "user-uuid",
    "email": "user@icloud.com",
    "username": "user",
    "full_name": "User Name"
  }
}
```

#### POST `/api/v1/auth/apple/signin`
Sign in with Apple ID token.

**Request:**
```json
{
  "id_token": "jwt-id-token-from-apple",
  "access_token": "optional-access-token"
}
```

#### GET `/api/v1/auth/apple/client-id`
Get Apple Client ID for frontend.

**Response:**
```json
{
  "client_id": "com.cognitest.apple-service-id"
}
```

---

## Account Management

### GET `/api/v1/auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "username",
  "full_name": "User Name",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### PUT `/api/v1/auth/me`
Update current user profile.

**Request:**
```json
{
  "full_name": "New Name",
  "email": "newemail@example.com",
  "username": "newusername",
  "password": "new-password"  // Optional
}
```

**Response:** (updated user object)

### POST `/api/v1/auth/logout`
Logout current user (clears cookies).

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

---

## Account Linking

### GET `/api/v1/auth/linked-accounts`
Get all OAuth accounts linked to current user.

**Headers:**
```
Authorization: Bearer <access-token>
```

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

### POST `/api/v1/auth/unlink-account`
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

**Error Responses:**

400 Bad Request - Missing provider:
```json
{
  "detail": "Provider is required"
}
```

400 Bad Request - Last auth method:
```json
{
  "detail": "Cannot unlink last authentication method. Set a password first."
}
```

404 Not Found - Account not linked:
```json
{
  "detail": "No google account linked"
}
```

### POST `/api/v1/auth/link-account`
Link a new OAuth account to current user.

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

**Error Responses:**

409 Conflict - Already linked to another user:
```json
{
  "detail": "This microsoft account is already linked to another user"
}
```

---

## Email & Password Recovery

### POST `/api/v1/auth/forgot-password`
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset code sent to email"
}
```

### POST `/api/v1/auth/verify-reset-code`
Verify password reset code (6-digit).

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Verification code is valid"
}
```

### POST `/api/v1/auth/reset-password`
Reset password using verification code.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "new_password": "new-secure-password"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully."
}
```

---

## Session Management

### POST `/api/v1/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "remember_me": false
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "access_token": "new-jwt-token"
}
```

**Sets Cookies:**
- `access_token` (new, HttpOnly)

---

## Error Codes

### 400 Bad Request
```json
{
  "detail": "Invalid input or configuration"
}
```
**Causes:** Missing credentials, invalid state, bad request data

### 401 Unauthorized
```json
{
  "detail": "Invalid credentials or token"
}
```
**Causes:** Invalid token, failed OAuth exchange, expired token

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```
**Causes:** User doesn't exist, OAuth account not linked

### 409 Conflict
```json
{
  "detail": "Resource already exists or conflicts"
}
```
**Causes:** Email/username taken, OAuth account already linked

### 500 Internal Server Error
```json
{
  "detail": "Server error"
}
```
**Causes:** Unexpected error, service unavailable

---

## Testing with cURL

### Test Google OAuth
```bash
# Get client ID
curl http://localhost:8000/api/v1/auth/google/client-id

# Get authorization URL
curl http://localhost:8000/api/v1/auth/google/authorize

# Sign in with ID token
curl -X POST http://localhost:8000/api/v1/auth/google/signin \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "your-google-id-token"
  }' \
  -v
```

### Test Account Linking
```bash
# Get linked accounts (requires auth)
curl http://localhost:8000/api/v1/auth/linked-accounts \
  -H "Authorization: Bearer your-jwt-token"

# Unlink account
curl -X POST http://localhost:8000/api/v1/auth/unlink-account \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'
```

### Test User Endpoints
```bash
# Get current user
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer your-jwt-token"

# Update profile
curl -X PUT http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "New Name"
  }'

# Logout
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Request Headers

### Standard Headers
```
Content-Type: application/json
Accept: application/json
```

### Authentication Headers
```
Authorization: Bearer <jwt-access-token>
```

### Browser Headers (automatic)
```
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

---

## Response Format

All responses follow this format:

**Success (2xx):**
```json
{
  "message": "Description",
  "data": { /* optional */ },
  "user": { /* optional for auth endpoints */ }
}
```

**Error (4xx, 5xx):**
```json
{
  "detail": "Error message"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently no rate limiting. Add as needed for production.

---

## CORS Configuration

Allowed origins (configured in `app/core/config.py`):
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`

Update for production domains.

---

## Webhook Events

Not implemented yet. Can be added for:
- User created via OAuth
- Account linked/unlinked
- Failed authentication attempts
- Token refreshed

---

## Pagination

Not implemented for current endpoints.

---

## Filtering & Searching

Not implemented for current endpoints.

---

## API Versioning

Current version: `v1`
Base path: `/api/v1`

---

## Changelog

### v1.0.0 (2024-11-01)
- Initial release
- Google OAuth support
- Microsoft OAuth support
- Apple OAuth support
- Account linking support
- User profile management

---

## Related Documentation

- [OAuth Implementation Guide](./OAUTH_IMPLEMENTATION_GUIDE.md)
- [Implementation Summary](./SSO_IMPLEMENTATION_SUMMARY.md)
- [Quick Start Guide](./OAUTH_QUICKSTART.md)

---

**Last Updated:** 2024-11-01
**API Version:** v1
**Status:** Production Ready

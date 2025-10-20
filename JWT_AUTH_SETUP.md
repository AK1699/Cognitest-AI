# JWT Authentication Setup Guide

## Overview

Cognitest now uses JWT (JSON Web Tokens) for authentication instead of Clerk. This provides a self-hosted authentication solution with complete control over user management.

---

## 🎯 Features

- **Signup/Login** - Email and password authentication
- **JWT Tokens** - Secure access and refresh tokens
- **Password Security** - Bcrypt hashing with validation
- **Protected Routes** - Middleware for authenticated endpoints
- **User Management** - Full CRUD operations for users
- **Session Management** - Automatic token refresh

---

## 🗄️ Database Setup

### 1. Run Migrations

The User model has been created. You need to run database migrations:

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Create migration
alembic revision --autogenerate -m "Add users table for JWT authentication"

# Run migration
alembic upgrade head
```

### 2. User Table Schema

The `users` table includes:
- `id` (UUID) - Primary key
- `email` (String) - Unique, indexed
- `username` (String) - Unique, indexed
- `full_name` (String) - Optional
- `hashed_password` (String) - Bcrypt hashed
- `is_active` (Boolean) - Account status
- `is_superuser` (Boolean) - Admin privileges
- `created_at`, `updated_at` (DateTime)

---

## 🔐 Backend API Endpoints

### Authentication Routes

All routes are prefixed with `/api/v1/auth`:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Create new account | No |
| POST | `/login` | Login with email/password | No |
| POST | `/refresh` | Refresh access token | No |
| GET | `/me` | Get current user info | Yes |
| PUT | `/me` | Update current user | Yes |
| POST | `/logout` | Logout (client-side) | Yes |

### Request/Response Examples

**Signup:**
```json
// POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "full_name": "John Doe"
}

// Response
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Login:**
```json
// POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

// Response
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Get Current User:**
```bash
# GET /api/v1/auth/me
# Headers: Authorization: Bearer <access_token>

# Response
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-01-01T00:00:00",
  "updated_at": "2025-01-01T00:00:00"
}
```

---

## 🎨 Frontend Integration

### Auth Context

The `AuthProvider` wraps the entire application and provides:

```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, username: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}
```

### Using Authentication in Components

```typescript
'use client'

import { useAuth } from '@/lib/auth-context'

export default function MyComponent() {
  const { user, loading, logout } = useAuth()

  if (loading) return <div>Loading...</div>

  if (!user) {
    return <div>Please login</div>
  }

  return (
    <div>
      <h1>Welcome, {user.full_name || user.username}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Protected Routes

Create a middleware or component to protect routes:

```typescript
// components/protected-route.tsx
'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

---

## 🔒 Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)

---

## 🛡️ Security Features

### Token Management
- **Access Token**: Expires in 24 hours (configurable in `backend/app/core/config.py`)
- **Refresh Token**: Expires in 7 days
- Tokens stored in `localStorage` (consider `httpOnly` cookies for production)

### Password Hashing
- Uses `bcrypt` with automatic salt generation
- Configured via `passlib` in `backend/app/core/security.py`

### Protected Endpoints
- Use `get_current_user` dependency for authentication
- Use `get_current_active_user` for active users only
- Use `get_current_superuser` for admin-only routes

---

## 📋 Next Steps

### 1. Setup Database
```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### 2. Start Backend
```bash
npm run backend
# OR
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
```

### 3. Start Frontend
```bash
npm run frontend
# OR
cd frontend && npm run dev
```

### 4. Test Authentication
- Visit http://localhost:3000/auth/signup
- Create an account
- Login at http://localhost:3000/auth/signin
- Access protected dashboard

---

## 🧪 Testing

### Manual Testing

1. **Test Signup**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "username": "testuser",
       "password": "Test123456",
       "full_name": "Test User"
     }'
   ```

2. **Test Login**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123456"
     }'
   ```

3. **Test Get Current User**:
   ```bash
   curl http://localhost:8000/api/v1/auth/me \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

---

## 🔧 Configuration

### Backend (`backend/app/core/config.py`)

```python
SECRET_KEY: str = "your-secret-key-change-in-production"
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🚨 Common Issues

### "Invalid credentials" error
- Check email and password are correct
- Ensure user account exists in database
- Verify password meets requirements

### "Could not validate credentials"
- Token may be expired
- Check Authorization header format: `Bearer <token>`
- Verify SECRET_KEY matches between token creation and verification

### Database connection errors
- Ensure PostgreSQL is running
- Check DATABASE_URL in `backend/.env`
- Run migrations: `alembic upgrade head`

---

## 📚 File Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   └── auth.py              # Authentication endpoints
│   ├── core/
│   │   ├── deps.py               # Authentication dependencies
│   │   └── security.py           # JWT and password utilities
│   ├── models/
│   │   └── user.py               # User database model
│   └── schemas/
│       └── user.py               # Pydantic schemas

frontend/
├── app/
│   └── auth/
│       ├── signin/
│       │   └── page.tsx          # Sign-in page
│       └── signup/
│           └── page.tsx          # Sign-up page
└── lib/
    └── auth-context.tsx          # Authentication context
```

---

## 🎓 Best Practices

1. **Use HTTPS in Production** - Always use SSL/TLS
2. **Rotate Secrets** - Change SECRET_KEY regularly
3. **Implement Rate Limiting** - Prevent brute force attacks
4. **Add Email Verification** - Verify user emails
5. **Enable 2FA** - Two-factor authentication for enhanced security
6. **Log Authentication Events** - Track login attempts
7. **Use httpOnly Cookies** - Consider cookies over localStorage for tokens

---

**JWT Authentication is now fully implemented!** 🎉

Visit http://localhost:3000/auth/signup to create your first account.

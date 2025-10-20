# Development Guide

## Quick Start (JWT Authentication)

Cognitest uses **JWT (JSON Web Tokens)** for authentication. You can start developing immediately with the built-in signup/signin pages.

### 🚀 Instant Start

```bash
npm start
```

**Landing Page**: http://localhost:3000/cognitest.ai

That's it! One command starts everything:
- PostgreSQL database
- Qdrant vector database
- Backend (FastAPI on port 8000)
- Frontend (Next.js on port 3000)

### 📝 First Time Setup

You need to run database migrations before using authentication:

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

This creates the `users` table in PostgreSQL.

### 🔐 Create Your Account

1. Visit http://localhost:3000/cognitest.ai (landing page)
2. Click "Get Started" or "Sign In" button
3. Fill in your details (email, username, password)
4. Click "Create account"
5. You'll be automatically logged in and redirected to the dashboard

### 🎯 Features Available

- **Landing Page**: http://localhost:3000/cognitest.ai
- **Signup**: http://localhost:3000/auth/signup
- **Sign In**: http://localhost:3000/auth/signin
- **JWT Tokens**: Secure access and refresh tokens
- **Password Validation**: Strong password requirements enforced
- **Protected Routes**: Automatic redirect if not authenticated

---

## 🔐 JWT Authentication Details

Cognitest uses a custom JWT authentication system with the following features:

### Security Features
- **Bcrypt Password Hashing**: Passwords are securely hashed
- **Access Tokens**: Expire in 24 hours
- **Refresh Tokens**: Expire in 7 days
- **Automatic Refresh**: Tokens refresh automatically when expired

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

For complete authentication documentation, see [JWT_AUTH_SETUP.md](JWT_AUTH_SETUP.md)

---

## 🤖 Adding AI Features (Optional)

For AI-powered test generation, you'll need an OpenAI API key:

### Step 1: Get OpenAI API Key

1. Sign up at https://platform.openai.com
2. Go to https://platform.openai.com/api-keys
3. Create a new API key

### Step 2: Add to Backend Environment

Edit `backend/.env`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Step 3: Restart Backend

```bash
# Stop npm run dev (Ctrl+C)
# Then start again
npm run dev
```

AI features will now work!

---

## 📝 Environment Files Summary

### Frontend (`frontend/.env.local`)
✅ **Created** - API URLs configured
⚠️ **Optional** - Clerk keys (for authentication)

### Backend (`backend/.env`)
✅ **Created** - Database configured
⚠️ **Optional** - OpenAI key (for AI features)

---

## 🎯 Development Workflow

### Daily Development (One Command!)

```bash
npm start
```

This single command starts everything you need!

### Stopping

```bash
# Press Ctrl+C to stop everything

# If needed, manually stop services:
npm run services:stop
```

### Alternative: Manual Control

If you prefer to start things separately:

**Start services only:**
```bash
npm run services:start
```

**Start backend + frontend:**
```bash
npm run dev
```

**Backend only:**
```bash
npm run backend
```

**Frontend only:**
```bash
npm run frontend
```

### Database Migrations

```bash
npm run migrate
```

### Background Workers (Celery)

```bash
npm run celery
```

---

## 🐛 Troubleshooting

### "Internal Server Error" on localhost:3000

**Solution**: The app now runs without authentication! Just refresh the page.

If still seeing errors:
1. Check Terminal 2 for error logs
2. Ensure both frontend and backend are running
3. Check `frontend/.env.local` exists

### Backend Not Starting

**Solution**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Build Errors

**Solution**:
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Errors

**Solution**:
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start if needed
brew services start postgresql@15

# Create database if needed
createdb cognitest
```

---

## 📚 Next Steps

1. ✅ Start app without authentication (works now!)
2. 📝 Explore the UI and test management features
3. 🔐 Add Clerk authentication when ready
4. 🤖 Add OpenAI key for AI features
5. 🚀 Start building test suites!

---

## 🆘 Need Help?

- Check [START_HERE.md](START_HERE.md) for setup guide
- See [NPM_SCRIPTS.md](NPM_SCRIPTS.md) for all commands
- Review [QUICK_START.md](QUICK_START.md) for detailed setup

---

**Ready to develop!** The app runs without authentication by default. 🎉

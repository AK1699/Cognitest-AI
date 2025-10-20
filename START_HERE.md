# 🎯 START HERE - Launch Cognitest Localhost

## 🚀 Super Quick Start (1 Command!)

If you already have PostgreSQL and Qdrant installed:

```bash
npm start
```

**Then open**: http://localhost:3000/cognitest.ai

That's it! One command starts:
- ✅ PostgreSQL
- ✅ Qdrant
- ✅ Backend (FastAPI)
- ✅ Frontend (Next.js)

Everything runs concurrently with color-coded logs!

---

## 📋 First Time Setup (Do This Once)

### 1. Install Prerequisites

**macOS (using Homebrew):**
```bash
# Install everything at once
brew install postgresql@15 node python@3.11

# Start service
brew services start postgresql@15

# Create database
createdb cognitest
```

**Ubuntu:**
```bash
sudo apt update
sudo apt install postgresql nodejs npm python3.11
sudo systemctl start postgresql
sudo -u postgres createdb cognitest
```

### 2. Install Qdrant

**macOS:**
```bash
brew install qdrant
```

**Other:**
- Download from: https://qdrant.tech/documentation/quick-start/

### 3. Get API Keys

You need two API keys (both have free tiers):

**OpenAI** (for AI features):
- Sign up: https://platform.openai.com/
- Get key: https://platform.openai.com/api-keys
- Copy the key (starts with `sk-`)

**Clerk** (for authentication):
- Sign up: https://clerk.com/
- Create application
- Get your keys from dashboard

### 4. Setup Project

```bash
# Navigate to project
cd /Users/akash/Platform/cognitest

# Install root dependencies (concurrently)
npm install

# Backend setup
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Frontend setup
cd ../frontend
cp .env.example .env.local
# Edit .env.local and add your Clerk keys

# Install all dependencies
cd ..
npm run install:all

# Run migrations
npm run migrate
```

---

## 🎮 Daily Usage (After First Setup)

### ⚡ One Command Start (Recommended)

Start everything with a single command:

```bash
npm start
```

This automatically starts:
1. PostgreSQL database
2. Qdrant vector database
3. FastAPI backend server
4. Next.js frontend server

All in one terminal with color-coded output!

### 🔧 Alternative: Manual Control

If you prefer more control, start services and apps separately:

**Terminal 1 - Services:**
```bash
npm run services:start
```

**Terminal 2 - Backend + Frontend:**
```bash
npm run dev
```

**Or even more granular:**

**Terminal 2 - Backend only:**
```bash
npm run backend
```

**Terminal 3 - Frontend only:**
```bash
npm run frontend
```

---

## 🌐 Access Your Application

Once running, visit:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:8000/api/docs | API documentation |
| **Backend Health** | http://localhost:8000/health | Health check |
| **Qdrant** | http://localhost:6333/dashboard | Vector database |

---

## ✅ Quick Health Check

Run this to verify everything is working:

```bash
# Check PostgreSQL
psql cognitest -c "SELECT version();"

# Check Backend
curl http://localhost:8000/health

# Check Frontend
curl http://localhost:3000
```

All should respond successfully!

---

## 🛑 Stop Everything

```bash
# Stop frontend + backend (Ctrl+C in Terminal 2)

# Stop services
npm run services:stop
```

Or manually:
```bash
# Stop services
brew services stop postgresql@15
brew services stop qdrant
```

---

## 🐛 Common Issues

### "Command not found: uvicorn"
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill -9
```

### "Database connection failed"
```bash
brew services restart postgresql@15
createdb cognitest
```

### "OpenAI API error"
- Check your `backend/.env` file
- Verify the API key is correct
- Ensure you have credits in your OpenAI account

---

## 📚 More Help

- **NPM Commands**: See [NPM_SCRIPTS.md](NPM_SCRIPTS.md) - All available npm scripts
- **Detailed Guide**: See [QUICK_START.md](QUICK_START.md)
- **Full Documentation**: See [GETTING_STARTED.md](GETTING_STARTED.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🎓 What's Next?

Once your localhost is running:

1. **Sign Up** at http://localhost:3000
2. **Create a Project**
3. **Generate a Test Plan** using AI
4. **Explore Features**:
   - Test Management
   - API Testing
   - Automation Hub
   - Security Testing
   - Performance Testing

---

**Need help?** Open an issue or check the documentation!

**Ready to start?** Run: `npm run dev` 🚀

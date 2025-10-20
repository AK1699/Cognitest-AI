# 🚀 Quick Start - Get Localhost Running

This guide will help you start Cognitest on your local machine in just a few steps.

---

## ⚡ Prerequisites Check

Make sure you have these installed:

```bash
# Check Node.js (need 20+)
node --version

# Check Python (need 3.11+)
python3 --version

# Check PostgreSQL (need 15+)
psql --version
```

If anything is missing, see [Installation](#installation) below.

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Install Services

**macOS:**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start service
brew services start postgresql@15

# Create database
createdb cognitest
```

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb cognitest
```

**Windows:**
- Install PostgreSQL from https://www.postgresql.org/download/windows/
- Create database using pgAdmin

### Step 2: Install Qdrant (Vector Database)

**Option A: Homebrew (macOS/Linux)**
```bash
brew install qdrant
```

**Option B: Download Binary**
```bash
# Linux
wget https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-musl.tar.gz
tar -xzf qdrant-x86_64-unknown-linux-musl.tar.gz
chmod +x qdrant
```

**Option C: Package Manager (Ubuntu)**
```bash
wget https://github.com/qdrant/qdrant/releases/latest/download/qdrant-amd64.deb
sudo dpkg -i qdrant-amd64.deb
sudo systemctl start qdrant
```

### Step 3: Clone and Setup Environment Variables

```bash
# Navigate to project
cd /Users/akash/Platform/cognitest

# Backend environment
cd backend
cp .env.example .env
```

**Edit `backend/.env`** and add your OpenAI key:
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

Get your OpenAI key from: https://platform.openai.com/api-keys

```bash
# Frontend environment
cd ../frontend
cp .env.example .env.local
```

**Edit `frontend/.env.local`** and add your Clerk keys:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
CLERK_SECRET_KEY=sk_test_your-key-here
```

Get Clerk keys from: https://clerk.com/ (free account)

### Step 4: Install Dependencies

**Backend:**
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

**Frontend:**
```bash
cd ../frontend

# Install dependencies
npm install
```

### Step 5: Setup Database

```bash
cd ../backend

# Make sure virtual environment is activated
source venv/bin/activate  # if not already active

# Run migrations
alembic upgrade head
```

### Step 6: Start Everything! 🎉

You'll need **2 terminal windows/tabs**:

#### Terminal 1: Start Services (PostgreSQL + Qdrant)
```bash
cd /Users/akash/Platform/cognitest

# Start PostgreSQL and Qdrant
npm run services:start
```

#### Terminal 2: Start Backend + Frontend Together
```bash
cd /Users/akash/Platform/cognitest

# Start both backend and frontend with one command
npm run dev
```

This will automatically start:
- **Backend** on http://localhost:8000
- **Frontend** on http://localhost:3000

#### Optional: Start Celery Worker
```bash
# In a separate terminal if needed
npm run celery
```

---

## 🌐 Access Your Application

Once everything is running:

- **Frontend (Main App)**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/api/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

---

## ✅ Verify Everything is Running

### Check Services Status

```bash
# PostgreSQL
brew services list | grep postgresql
# Should show: started

# Or on Ubuntu
sudo systemctl status postgresql
```

### Test Database Connection

```bash
psql cognitest
# Should connect successfully
# Type \q to quit
```

### Test Backend

```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","version":"0.1.0"}
```

---

## 🛑 Stop Everything

When you're done:

```bash
# Stop Backend + Frontend (in Terminal 2)
Ctrl + C

# Stop Services
npm run services:stop

# Or manually stop services
brew services stop postgresql@15
brew services stop qdrant
```

---

## 📝 Helpful Scripts

### Create a Start Script

Create `scripts/start-dev.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Cognitest Development Environment..."

# Check if services are running
echo "📊 Checking PostgreSQL..."
brew services start postgresql@15

echo "📊 Starting Qdrant..."
brew services start qdrant

echo "✅ All services started!"
echo ""
echo "Now run in separate terminals:"
echo "  Terminal 1: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  Terminal 2: cd frontend && npm run dev"
```

Make it executable:
```bash
chmod +x scripts/start-dev.sh
```

Run it:
```bash
./scripts/start-dev.sh
```

### Create a Stop Script

Create `scripts/stop-dev.sh`:

```bash
#!/bin/bash

echo "🛑 Stopping Cognitest Development Environment..."

brew services stop postgresql@15
brew services stop qdrant

echo "✅ All services stopped!"
```

Make it executable:
```bash
chmod +x scripts/stop-dev.sh
```

---

## 🐛 Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'app'`

**Solution**:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend build errors

**Error**: `Module not found: Can't resolve '@/components/ui/button'`

**Solution**:
```bash
cd frontend
rm -rf node_modules .next
npm install
```

### Database connection failed

**Error**: `could not connect to server: Connection refused`

**Solution**:
```bash
# macOS
brew services restart postgresql@15

# Ubuntu
sudo systemctl restart postgresql

# Check if database exists
psql -l | grep cognitest
```

### Port already in use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### OpenAI API errors

**Error**: `Invalid API key`

**Solution**:
- Check your `backend/.env` file
- Verify the key starts with `sk-`
- Ensure you have credits in your OpenAI account
- Get a new key from https://platform.openai.com/api-keys

### Qdrant connection failed

**Error**: `Could not connect to Qdrant`

**Solution**:
```bash
# Check if Qdrant is running
curl http://localhost:6333/healthz

# Restart Qdrant
brew services restart qdrant
# OR
./qdrant
```

---

## 📱 First Time Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Qdrant installed and running
- [ ] Database `cognitest` created
- [ ] Backend `.env` file created with OpenAI key
- [ ] Frontend `.env.local` file created with Clerk keys
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Database migrations run (`alembic upgrade head`)
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Can access API docs at http://localhost:8000/api/docs

---

## 🎓 Next Steps

Once everything is running:

1. **Create an Account**
   - Go to http://localhost:3000
   - Sign up using Clerk authentication

2. **Create Your First Project**
   - Click "Create New Project"
   - Enter project details

3. **Generate a Test Plan with AI**
   - Go to Test Management
   - Click "Generate with AI"
   - Enter your requirements

4. **Explore the Dashboard**
   - Test Management
   - API Testing
   - Automation Hub

---

## 💡 Pro Tips

### Use tmux or screen for multiple terminals

```bash
# Install tmux
brew install tmux

# Start tmux session
tmux new -s cognitest

# Split into panes
# Ctrl+B then " (horizontal split)
# Ctrl+B then % (vertical split)

# Navigate between panes
# Ctrl+B then arrow keys
```

### Use VS Code tasks

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "cd backend && source venv/bin/activate && uvicorn app.main:app --reload",
      "group": "build"
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "cd frontend && npm run dev",
      "group": "build"
    }
  ]
}
```

---

## 🆘 Need More Help?

- **Documentation**: Check [GETTING_STARTED.md](GETTING_STARTED.md)
- **Architecture**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
- **Issues**: Open an issue on GitHub
- **Email**: support@cognitest.ai

---

**Happy Coding! 🚀**

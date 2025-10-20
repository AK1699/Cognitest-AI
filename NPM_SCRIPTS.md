# NPM Scripts Reference

This document lists all available npm scripts for Cognitest development.

---

## 🚀 Development Scripts

### `npm start` (Recommended - One Command!)
**Start EVERYTHING with a single command** - services, backend, and frontend!

```bash
npm start
```

This will:
1. ✅ Start PostgreSQL service
2. ✅ Start Qdrant service
3. ✅ Start FastAPI backend on http://localhost:8000
4. ✅ Start Next.js frontend on http://localhost:3000
5. ✅ Show color-coded logs for all services

**This is the easiest way to start developing!**

---

### `npm run dev:all`
Alias for `npm start` - starts everything.

```bash
npm run dev:all
```

---

### `npm run dev`
Start both backend and frontend (without starting services).

```bash
npm run dev
```

Use this if you've already started services manually.

---

### `npm run backend`
Start only the backend server.

```bash
npm run backend
```

---

### `npm run frontend`
Start only the frontend development server.

```bash
npm run frontend
```

---

## 🛠️ Service Management

### `npm run services:start`
Start PostgreSQL and Qdrant services.

```bash
npm run services:start
```

Checks and starts:
- PostgreSQL 15
- Qdrant vector database

---

### `npm run services:stop`
Stop all development services.

```bash
npm run services:stop
```

Stops:
- PostgreSQL
- Qdrant
- Any processes on ports 3000 and 8000

---

## 📦 Installation Scripts

### `npm run install:all`
Install both backend and frontend dependencies.

```bash
npm run install:all
```

Equivalent to:
- `npm run install:backend`
- `npm run install:frontend`

---

### `npm run install:backend`
Create Python virtual environment and install backend dependencies.

```bash
npm run install:backend
```

This will:
1. Create `backend/venv` directory
2. Install all packages from `backend/requirements.txt`

---

### `npm run install:frontend`
Install frontend npm dependencies.

```bash
npm run install:frontend
```

---

## 🗄️ Database Scripts

### `npm run migrate`
Run Alembic database migrations.

```bash
npm run migrate
```

Runs: `alembic upgrade head`

---

## ⚙️ Background Workers

### `npm run celery`
Start Celery worker for background tasks.

```bash
npm run celery
```

Useful for:
- AI test generation tasks
- Background job processing
- Scheduled tasks

---

## 📋 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend together |
| `npm start` | Alias for `npm run dev` |
| `npm run backend` | Start backend only |
| `npm run frontend` | Start frontend only |
| `npm run services:start` | Start PostgreSQL + Qdrant |
| `npm run services:stop` | Stop all services |
| `npm run install:all` | Install all dependencies |
| `npm run install:backend` | Install backend dependencies |
| `npm run install:frontend` | Install frontend dependencies |
| `npm run migrate` | Run database migrations |
| `npm run celery` | Start Celery worker |

---

## 🎯 Typical Workflow

### First Time Setup
```bash
# 1. Install all dependencies
npm install
npm run install:all

# 2. Setup environment files
# Edit backend/.env and frontend/.env.local

# 3. Run migrations
npm run migrate

# 4. Start EVERYTHING!
npm start
```

### Daily Development (One Command!)
```bash
npm start
```

That's it! Everything starts automatically:
- PostgreSQL
- Qdrant
- Backend
- Frontend

### Alternative: Manual Control
```bash
# Terminal 1
npm run services:start

# Terminal 2
npm run dev
```

### Cleanup
```bash
# Stop backend + frontend (Ctrl+C)
# Then stop services:
npm run services:stop
```

---

## 🔧 Behind the Scenes

- **concurrently**: Used to run multiple commands in parallel with color-coded output
- **Scripts location**: `/scripts/start-backend.sh` for backend startup
- **Process management**: Services use Homebrew on macOS

---

**Tip**: All scripts are defined in the root `package.json` file.

#!/bin/bash
# Helper script to restart the backend with proper cleanup

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                        Backend Restart Helper                                ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if running from backend directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Must run from backend directory"
    echo "   Run: cd backend && bash restart_backend.sh"
    exit 1
fi

# Find and kill any process on port 8000
echo "🔍 Checking for existing backend process..."
PID=$(lsof -ti:8000 2>/dev/null)

if [ ! -z "$PID" ]; then
    echo "   Found process on port 8000 (PID: $PID)"
    echo "   Stopping..."
    kill -9 $PID 2>/dev/null
    sleep 2
    echo "   ✅ Stopped"
else
    echo "   No process found on port 8000"
fi

# Activate virtual environment
echo ""
echo "🔧 Activating virtual environment..."
if [ ! -d "venv" ]; then
    echo "❌ Error: venv directory not found"
    exit 1
fi

source venv/bin/activate
echo "   ✅ Virtual environment activated"

# Start the backend
echo ""
echo "🚀 Starting backend server..."
echo "   Command: uvicorn app.main:app --reload --port 8000"
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║  Backend starting...                                                         ║"
echo "║  Wait for 'Application startup complete' message                            ║"
echo "║  Then press Ctrl+C to stop, or let it run                                   ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

uvicorn app.main:app --reload --port 8000

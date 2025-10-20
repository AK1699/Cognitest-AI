#!/bin/bash

echo "🛑 Stopping Cognitest Development Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop PostgreSQL
echo "📊 Stopping PostgreSQL..."
brew services stop postgresql@15
sleep 1

# Stop Qdrant
echo "📊 Stopping Qdrant..."
brew services stop qdrant 2>/dev/null || {
    # Try to kill Qdrant process if not running via brew
    if lsof -ti:6333 > /dev/null 2>&1; then
        lsof -ti:6333 | xargs kill -9
        echo "   Killed Qdrant process"
    fi
}

# Kill any processes on common ports
echo ""
echo "🔍 Checking for running processes on ports..."

# Backend (8000)
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   Stopping process on port 8000 (Backend)..."
    lsof -ti:8000 | xargs kill -9
fi

# Frontend (3000)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   Stopping process on port 3000 (Frontend)..."
    lsof -ti:3000 | xargs kill -9
fi

echo ""
echo -e "${GREEN}✅ All services stopped!${NC}"
echo ""

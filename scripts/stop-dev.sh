#!/bin/bash

echo "🛑 Stopping Cognitest Development Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop application servers first
echo "🔍 Stopping application servers..."

# Backend (8000)
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   Stopping Backend (port 8000)..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    pkill -9 -f "uvicorn app.main:app" 2>/dev/null
    echo -e "   ${GREEN}✓${NC} Backend stopped"
fi

# Frontend (3000, 3001)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   Stopping Frontend (port 3000)..."
    lsof -ti:3000,3001 | xargs kill -9 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    echo -e "   ${GREEN}✓${NC} Frontend stopped"
fi

# Microservices (8001-8005)
echo "   Stopping Microservices..."
bash scripts/stop-services.sh > /dev/null 2>&1
echo -e "   ${GREEN}✓${NC} Microservices stopped"

echo ""
echo "📊 Stopping database services..."

# Stop PostgreSQL (try different versions)
if brew services list | grep -q "postgresql@14.*started"; then
    echo "   Stopping PostgreSQL@14..."
    brew services stop postgresql@14
    echo -e "   ${GREEN}✓${NC} PostgreSQL@14 stopped"
elif brew services list | grep -q "postgresql@15.*started"; then
    echo "   Stopping PostgreSQL@15..."
    brew services stop postgresql@15
    echo -e "   ${GREEN}✓${NC} PostgreSQL@15 stopped"
elif brew services list | grep -q "postgresql.*started"; then
    echo "   Stopping PostgreSQL..."
    brew services stop postgresql
    echo -e "   ${GREEN}✓${NC} PostgreSQL stopped"
fi

# Stop Redis
if brew services list | grep -q "redis.*started"; then
    echo "   Stopping Redis..."
    brew services stop redis
    echo -e "   ${GREEN}✓${NC} Redis stopped"
fi

# Stop Qdrant (optional)
if brew services list | grep -q "qdrant.*started"; then
    echo "   Stopping Qdrant..."
    brew services stop qdrant
    echo -e "   ${GREEN}✓${NC} Qdrant stopped"
elif lsof -ti:6333 > /dev/null 2>&1; then
    echo "   Killing Qdrant process on port 6333..."
    lsof -ti:6333 | xargs kill -9 2>/dev/null
    echo -e "   ${GREEN}✓${NC} Qdrant process killed"
fi

# Clean up any remaining processes
echo ""
echo "🧹 Cleaning up..."
pkill -9 -f "python.*uvicorn" 2>/dev/null
pkill -9 -f "node.*next" 2>/dev/null

echo ""
echo -e "${GREEN}✅ All services stopped successfully!${NC}"
echo ""

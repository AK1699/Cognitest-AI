#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Cognitest - Complete Development Environment${NC}"
echo ""

# Function to check if a brew service is running
check_service() {
    if brew services list | grep -q "$1.*started"; then
        echo -e "${GREEN}✓${NC} $1 is already running"
        return 0
    else
        echo -e "${YELLOW}○${NC} Starting $1..."
        return 1
    fi
}

# Function to check if a port is in use
check_port() {
    if lsof -ti:$1 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Service on port $1 is running"
        return 0
    else
        echo -e "${YELLOW}○${NC} Port $1 is free"
        return 1
    fi
}

# Check and start PostgreSQL (try different versions)
echo "📊 PostgreSQL..."
if ! check_service "postgresql@14" && ! check_service "postgresql@15" && ! check_service "postgresql"; then
    # Try to start any version available
    if brew services list | grep -q "postgresql@14"; then
        brew services start postgresql@14
    elif brew services list | grep -q "postgresql@15"; then
        brew services start postgresql@15
    else
        brew services start postgresql
    fi
    sleep 3
    echo -e "${GREEN}✓${NC} PostgreSQL started"
fi

# Check and start Redis
echo "📦 Redis..."
if ! check_service "redis"; then
    brew services start redis
    sleep 2
    echo -e "${GREEN}✓${NC} Redis started"
fi

# Check and start Qdrant (optional - AI vector database)
echo "🔍 Qdrant..."
if lsof -ti:6333 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Qdrant is already running on port 6333"
else
    echo -e "${YELLOW}○${NC} Starting Qdrant..."
    brew services start qdrant 2>/dev/null || {
        echo -e "${YELLOW}⚠${NC}  Qdrant not installed (optional - for vector search)"
        echo -e "${YELLOW}   Install with: brew install qdrant${NC}"
    }
fi

echo ""
echo -e "${GREEN}✅ All database services started!${NC}"
echo ""

# Verify database connections
echo "🔍 Verifying database connections..."
pg_isready -h localhost -p 5432 > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} PostgreSQL connection OK" || echo -e "${RED}✗${NC} PostgreSQL connection failed"
redis-cli ping > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} Redis connection OK" || echo -e "${RED}✗${NC} Redis connection failed"

echo ""
echo -e "${BLUE}🔥 Starting Backend & Frontend...${NC}"
echo ""

# Start backend and frontend concurrently
cd "$(dirname "$0")/.."
npm run dev

#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Cognitest - Complete Development Environment${NC}"
echo ""

# Function to check if a service is running
check_service() {
    if brew services list | grep -q "$1.*started"; then
        echo -e "${GREEN}✓${NC} $1 is already running"
        return 0
    else
        echo -e "${YELLOW}○${NC} Starting $1..."
        return 1
    fi
}

# Check and start PostgreSQL
echo "📊 PostgreSQL..."
if ! check_service "postgresql@15"; then
    brew services start postgresql@15
    sleep 2
fi

# Check and start Qdrant
echo "📊 Qdrant..."
if lsof -ti:6333 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Qdrant is already running"
else
    echo -e "${YELLOW}○${NC} Starting Qdrant..."
    brew services start qdrant 2>/dev/null || {
        echo -e "${RED}✗${NC} Qdrant not installed via brew"
    }
    sleep 2
fi

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo -e "${BLUE}🔥 Starting Backend & Frontend...${NC}"
echo ""

# Start backend and frontend concurrently
cd "$(dirname "$0")/.."
npm run dev

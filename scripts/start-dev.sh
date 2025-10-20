#!/bin/bash

echo "🚀 Starting Cognitest Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    if brew services list | grep -q "$1.*started"; then
        echo -e "${GREEN}✓${NC} $1 is running"
        return 0
    else
        echo -e "${YELLOW}○${NC} $1 is not running"
        return 1
    fi
}

# Check and start PostgreSQL
echo "📊 Checking PostgreSQL..."
if ! check_service "postgresql@15"; then
    echo "   Starting PostgreSQL..."
    brew services start postgresql@15
    sleep 2
fi

# Check Qdrant
echo "📊 Checking Qdrant..."
if lsof -ti:6333 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Qdrant is running"
else
    echo -e "${YELLOW}○${NC} Qdrant is not running"
    echo "   Starting Qdrant..."
    brew services start qdrant 2>/dev/null || {
        echo -e "${RED}✗${NC} Qdrant not installed via brew. Start it manually: ./qdrant"
    }
fi

echo ""
echo "✅ All services checked/started!"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "  ${YELLOW}Terminal 1${NC} - Backend:"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    uvicorn app.main:app --reload --port 8000"
echo ""
echo "  ${YELLOW}Terminal 2${NC} - Frontend:"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo "  ${YELLOW}Terminal 3${NC} - Celery (Optional):"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    celery -A app.celery_app worker --loglevel=info"
echo ""
echo "📱 Access your app:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000/api/docs"
echo "   Qdrant:    http://localhost:6333/dashboard"
echo ""

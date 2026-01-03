#!/bin/bash

# Cognitest Microservices Orchestrator
# Starts all Cognitest microservices in the background

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Cognitest Microservices...${NC}"

# Function to start a service
start_service() {
    local name=$1
    local dir=$2
    local port=$3
    local log_file="/tmp/cognitest-${name}.log"

    echo -ne "${YELLOW}Starting ${name} on port ${port}...${NC}"
    
    cd "backend/services/${dir}"
    source ../../venv/bin/activate
    
    # Start uvicorn in background
    PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port ${port} > "${log_file}" 2>&1 &
    
    # Save PID
    local pid=$!
    echo $pid > "/tmp/cognitest-${name}.pid"
    
    cd - > /dev/null
    echo -e " ${GREEN}DONE (PID: ${pid})${NC}"
}

# Ensure we are in the root directory
cd "$(dirname "$0")/.."

# Backend services configuration
# Format: Name Directory Port
SERVICES=(
    "iam iam 8001"
    "core-management core-management 8002"
    "test-management test-management 8003"
    "task-management task-management 8004"
    "performance-testing performance-testing 8005"
)

# Start each service
for service in "${SERVICES[@]}"; do
    start_service $service
done

echo ""
echo -e "${GREEN}✅ All microservices started in the background!${NC}"
echo -e "Logs are available in /tmp/cognitest-*.log"
echo -e "Use 'scripts/stop-services.sh' to stop them."
echo ""

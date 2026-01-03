#!/bin/bash

# Cognitest Microservices Stopper
# Stops all Cognitest microservices started by start-services.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping Cognitest Microservices...${NC}"

# Backend services names (all enabled services)
SERVICES=("iam" "core-management" "test-management" "task-management" "performance-testing")

for name in "${SERVICES[@]}"; do
    pid_file="/tmp/cognitest-${name}.pid"
    if [ -f "${pid_file}" ]; then
        pid=$(cat "${pid_file}")
        echo -ne "${YELLOW}Stopping ${name} (PID: ${pid})...${NC}"
        kill "${pid}" 2>/dev/null
        rm "${pid_file}"
        echo -e " ${GREEN}DONE${NC}"
    else
        echo -e "${RED}⚠ ${name} PID file not found, skipping.${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ All microservices stopped!${NC}"
echo ""

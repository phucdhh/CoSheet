#!/bin/bash
# CoSheet Load Testing Script
# Requires Artillery: npm install -g artillery

set -e

echo "======================================"
echo "CoSheet Load Testing Suite"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Artillery is installed
if ! command -v artillery &> /dev/null; then
    echo -e "${RED}Error: Artillery not found!${NC}"
    echo "Install with: npm install -g artillery"
    exit 1
fi

echo -e "${GREEN}✓ Artillery installed${NC}"
echo ""

# Check if CoSheet is running
echo "Checking if CoSheet is running..."
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then
    echo -e "${RED}Error: CoSheet is not running!${NC}"
    echo "Start with: npm start"
    exit 1
fi

echo -e "${GREEN}✓ CoSheet is running${NC}"
echo ""

# Menu
echo "Select test type:"
echo "  1) Quick test (10 users, 1 min)"
echo "  2) Standard test (50 users, 5 min)"
echo "  3) Stress test (100 users, 10 min)"
echo "  4) Spike test (200 users, 5 min)"
echo "  5) Full suite (all tests)"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Running Quick Test...${NC}"
        artillery quick --count 10 --num 60 https://dulieu.truyenthong.edu.vn/
        ;;
    2)
        echo -e "${YELLOW}Running Standard Test...${NC}"
        artillery run load-test.yml
        ;;
    3)
        echo -e "${YELLOW}Running Stress Test (100 concurrent users)...${NC}"
        artillery run --config '{"phases":[{"duration":600,"arrivalRate":100}]}' load-test.yml
        ;;
    4)
        echo -e "${YELLOW}Running Spike Test (200 users)...${NC}"
        artillery run --config '{"phases":[{"duration":300,"arrivalRate":200}]}' load-test.yml
        ;;
    5)
        echo -e "${YELLOW}Running Full Test Suite...${NC}"
        
        echo -e "\n${GREEN}[1/4] Quick Test${NC}"
        artillery quick --count 10 --num 60 https://dulieu.truyenthong.edu.vn/
        
        echo -e "\n${GREEN}[2/4] Standard Test${NC}"
        artillery run load-test.yml
        
        echo -e "\n${GREEN}[3/4] Stress Test${NC}"
        artillery run --config '{"phases":[{"duration":600,"arrivalRate":100}]}' load-test.yml
        
        echo -e "\n${GREEN}[4/4] Spike Test${NC}"
        artillery run --config '{"phases":[{"duration":300,"arrivalRate":200}]}' load-test.yml
        
        echo -e "\n${GREEN}✓ All tests completed!${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}======================================"
echo "Test completed!"
echo "======================================${NC}"
echo ""
echo "Metrics to check:"
echo "  - Response time (p95, p99)"
echo "  - Error rate (should be <1%)"
echo "  - Requests per second"
echo "  - Memory usage: docker stats cosheet-app"
echo "  - Redis memory: redis-cli info memory"
echo ""
echo "View logs:"
echo "  tail -f logs/combined-*.log"
echo ""

#!/bin/bash
# Check CoSheet status and display information

CONTAINER_NAME="cosheet_mac"
PORT="5234"

echo "📊 CoSheet Status Report"
echo "========================"
echo ""

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container '${CONTAINER_NAME}' not found"
    echo ""
    echo "💡 Run './start.sh' to create and start CoSheet"
    exit 1
fi

# Container status
echo "🐳 Container Status:"
docker ps -a --filter name=${CONTAINER_NAME} --format "  Name:    {{.Names}}\n  Status:  {{.Status}}\n  Image:   {{.Image}}\n  Ports:   {{.Ports}}"
echo ""

# Check if running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    STATUS="running"
    echo "✅ CoSheet is RUNNING"
else
    STATUS="stopped"
    echo "🛑 CoSheet is STOPPED"
fi
echo ""

# Resource usage (if running)
if [ "$STATUS" = "running" ]; then
    echo "💻 Resource Usage:"
    docker stats ${CONTAINER_NAME} --no-stream --format "  CPU:     {{.CPUPerc}}\n  Memory:  {{.MemUsage}}\n  Net I/O: {{.NetIO}}"
    echo ""
    
    # HTTP health check
    echo "🌐 HTTP Health Check:"
    if curl -s -f -I http://localhost:${PORT}/ > /dev/null 2>&1; then
        echo "  ✅ http://localhost:${PORT}/ - OK"
        
        # Get response time
        RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' http://localhost:${PORT}/)
        echo "  ⏱️  Response time: ${RESPONSE_TIME}s"
    else
        echo "  ❌ http://localhost:${PORT}/ - FAILED"
        echo "  ⚠️  Server may be starting up or experiencing issues"
    fi
    echo ""
    
    # Container uptime
    echo "⏰ Container Uptime:"
    STARTED=$(docker inspect --format='{{.State.StartedAt}}' ${CONTAINER_NAME})
    echo "  Started: ${STARTED}"
    echo ""
    
    # Redis connection (if applicable)
    echo "🔌 Service Connections:"
    if docker exec ${CONTAINER_NAME} bash -c "command -v redis-cli > /dev/null 2>&1"; then
        if docker exec ${CONTAINER_NAME} redis-cli -h redis ping > /dev/null 2>&1; then
            echo "  ✅ Redis: Connected"
        else
            echo "  ❌ Redis: Not connected"
        fi
    else
        echo "  ℹ️  Redis: redis-cli not available in container"
    fi
    echo ""
    
    # Recent logs
    echo "📋 Recent Logs (last 10 lines):"
    echo "────────────────────────────────────────"
    docker logs --tail 10 ${CONTAINER_NAME} 2>&1 | sed 's/^/  /'
    echo "────────────────────────────────────────"
    echo ""
    
    # Useful commands
    echo "💡 Useful Commands:"
    echo "  View live logs:     docker logs -f ${CONTAINER_NAME}"
    echo "  Enter container:    docker exec -it ${CONTAINER_NAME} bash"
    echo "  Restart:            ./restart.sh"
    echo "  Stop:               ./stop.sh"
else
    # Container stopped - show last logs
    echo "📋 Last Logs (container stopped):"
    echo "────────────────────────────────────────"
    docker logs --tail 20 ${CONTAINER_NAME} 2>&1 | sed 's/^/  /'
    echo "────────────────────────────────────────"
    echo ""
    
    echo "💡 To start CoSheet:"
    echo "  ./start.sh"
fi

echo ""
echo "🌐 Access URL: http://localhost:${PORT}/"
echo "📍 Public URL: https://cosheet.truyenthong.edu.vn/"

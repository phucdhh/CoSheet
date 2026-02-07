#!/bin/bash
# Restart CoSheet Docker container

CONTAINER_NAME="cosheet_mac"

echo "🔄 Restarting CoSheet..."

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Restarting container ${CONTAINER_NAME}..."
    docker restart ${CONTAINER_NAME}
    
    # Wait for restart
    echo "⏳ Waiting for startup..."
    sleep 3
    
    # Check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ CoSheet restarted successfully"
        echo ""
        docker ps --filter name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "🌐 Access CoSheet at: http://localhost:5234"
        
        # Show last few log lines
        echo ""
        echo "📋 Recent logs:"
        docker logs --tail 15 ${CONTAINER_NAME}
        
        # Health check
        echo ""
        echo "📊 Health check..."
        sleep 2
        if curl -s -f -I http://localhost:5234/ > /dev/null 2>&1; then
            echo "✅ HTTP health check passed"
        else
            echo "⚠️  HTTP health check failed (may still be starting up)"
            echo "💡 Run './status.sh' to monitor startup progress"
        fi
    else
        echo "❌ Failed to restart CoSheet"
        echo "📋 Checking logs..."
        docker logs --tail 50 ${CONTAINER_NAME}
        exit 1
    fi
else
    echo "❌ Container ${CONTAINER_NAME} not found"
    echo "💡 Run './start.sh' to create and start the container"
    exit 1
fi

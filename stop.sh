#!/bin/bash
# Stop CoSheet Docker container

CONTAINER_NAME="cosheet_mac"

echo "🛑 Stopping CoSheet..."

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Stopping container ${CONTAINER_NAME}..."
    docker stop ${CONTAINER_NAME}
    
    # Wait for graceful shutdown
    sleep 2
    
    # Verify it stopped
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ CoSheet stopped successfully"
    else
        echo "⚠️  Container still running, forcing stop..."
        docker kill ${CONTAINER_NAME}
        echo "✅ CoSheet force stopped"
    fi
else
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "ℹ️  CoSheet container exists but is not running"
    else
        echo "ℹ️  CoSheet container not found"
    fi
fi

echo ""
echo "📊 Current container status:"
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    docker ps -a --filter name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}"
else
    echo "No container found"
fi

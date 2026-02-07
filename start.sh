#!/bin/bash
# Start CoSheet Docker container

CONTAINER_NAME="cosheet_mac"
IMAGE_NAME="cosheet:latest"

echo "🚀 Starting CoSheet..."

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Container exists, check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ CoSheet is already running"
        echo ""
        docker ps --filter name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        # Container exists but stopped, start it
        echo "📦 Starting existing container..."
        docker start ${CONTAINER_NAME}
        
        # Wait a moment for startup
        sleep 2
        
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "✅ CoSheet started successfully"
            echo ""
            docker ps --filter name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            echo ""
            echo "🌐 Access CoSheet at: http://localhost:5234"
        else
            echo "❌ Failed to start CoSheet"
            echo "📋 Checking logs..."
            docker logs --tail 50 ${CONTAINER_NAME}
            exit 1
        fi
    fi
else
    # Container doesn't exist, create and start it
    echo "📦 Creating new container from ${IMAGE_NAME}..."
    
    if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}$"; then
        echo "❌ Image ${IMAGE_NAME} not found"
        echo "💡 Please build the image first: docker build -t ${IMAGE_NAME} ."
        exit 1
    fi
    
    # Run container with docker-compose or docker run
    if [ -f "docker-compose.yml" ]; then
        echo "🐳 Using docker-compose..."
        docker-compose up -d
    else
        echo "🐳 Using docker run..."
        docker run -d \
            --name ${CONTAINER_NAME} \
            -p 5234:5234 \
            -v "$(pwd)/data:/usr/src/app/data" \
            -v "$(pwd)/logs:/usr/src/app/logs" \
            --restart unless-stopped \
            ${IMAGE_NAME}
    fi
    
    # Wait for startup
    sleep 3
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ CoSheet created and started successfully"
        echo ""
        docker ps --filter name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "🌐 Access CoSheet at: http://localhost:5234"
    else
        echo "❌ Failed to start CoSheet"
        echo "📋 Checking logs..."
        docker logs --tail 50 ${CONTAINER_NAME}
        exit 1
    fi
fi

echo ""
echo "📊 Quick health check..."
sleep 1
if curl -s -f -I http://localhost:5234/ > /dev/null 2>&1; then
    echo "✅ HTTP health check passed"
else
    echo "⚠️  HTTP health check failed (may still be starting up)"
fi

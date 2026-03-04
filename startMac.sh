#!/bin/bash
# Start CoSheet on Mac Mini (no Docker)
# Components: Redis + CoSheet Node.js app + Cloudflare Tunnel

COSHEET_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="5234"
COSHEET_LOG="/tmp/cosheet-app.log"
TUNNEL_LOG="/tmp/cosheet-tunnel.log"
COSHEET_PID_FILE="/tmp/cosheet-app.pid"
TUNNEL_PID_FILE="/tmp/cosheet-tunnel.pid"
TUNNEL_CONFIG="$HOME/.cloudflared/config-cosheet.yml"

echo "🚀 Starting CoSheet (Mac Mini - No Docker)"
echo "==========================================="
echo ""

# ─── 1. REDIS ───────────────────────────────────────────────────────────────
echo "🔴 [1/3] Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo "  ✅ Redis already running"
else
    echo "  ▶  Starting Redis..."
    redis-server --daemonize yes \
        --logfile /tmp/redis-cosheet.log \
        --dir "$COSHEET_DIR" \
        --appendonly yes \
        --appendfilename "cosheet.aof" > /dev/null 2>&1
    sleep 1
    if redis-cli ping > /dev/null 2>&1; then
        echo "  ✅ Redis started"
    else
        echo "  ❌ Redis failed to start"
        echo "  📋 Log: /tmp/redis-cosheet.log"
        exit 1
    fi
fi

# ─── 2. COSHEET APP ─────────────────────────────────────────────────────────
echo ""
echo "📊 [2/3] CoSheet app..."

if [ -f "$COSHEET_PID_FILE" ]; then
    OLD_PID=$(cat "$COSHEET_PID_FILE")
    if kill -0 "$OLD_PID" > /dev/null 2>&1; then
        echo "  ✅ CoSheet already running (PID $OLD_PID)"
    else
        rm -f "$COSHEET_PID_FILE"
    fi
fi

if [ ! -f "$COSHEET_PID_FILE" ]; then
    echo "  ▶  Starting CoSheet on port $PORT..."
    cd "$COSHEET_DIR"
    PORT=$PORT \
    REDIS_PORT_6379_TCP_ADDR=127.0.0.1 \
    REDIS_PORT_6379_TCP_PORT=6379 \
    NODE_ENV=production \
        node app.js >> "$COSHEET_LOG" 2>&1 &
    COSHEET_PID=$!
    echo $COSHEET_PID > "$COSHEET_PID_FILE"

    # Wait for HTTP to respond
    echo -n "  ⏳ Waiting for HTTP"
    for i in $(seq 1 15); do
        sleep 1
        if curl -s -f -o /dev/null http://127.0.0.1:$PORT/ 2>/dev/null; then
            echo ""
            echo "  ✅ CoSheet started (PID $COSHEET_PID)"
            break
        fi
        echo -n "."
        if [ $i -eq 15 ]; then
            echo ""
            echo "  ❌ CoSheet did not respond after 15s"
            echo "  📋 Log: $COSHEET_LOG"
            kill "$COSHEET_PID" 2>/dev/null
            rm -f "$COSHEET_PID_FILE"
            exit 1
        fi
    done
fi

# ─── 3. CLOUDFLARE TUNNEL ───────────────────────────────────────────────────
echo ""
echo "🌐 [3/3] Cloudflare Tunnel..."

if [ ! -f "$TUNNEL_CONFIG" ]; then
    echo "  ⚠️  Tunnel config not found: $TUNNEL_CONFIG"
    echo "  ℹ️  CoSheet is running locally at http://localhost:$PORT"
else
    if [ -f "$TUNNEL_PID_FILE" ]; then
        OLD_PID=$(cat "$TUNNEL_PID_FILE")
        if kill -0 "$OLD_PID" > /dev/null 2>&1; then
            echo "  ✅ Tunnel already running (PID $OLD_PID)"
        else
            rm -f "$TUNNEL_PID_FILE"
        fi
    fi

    if [ ! -f "$TUNNEL_PID_FILE" ]; then
        echo "  ▶  Starting tunnel..."
        cloudflared tunnel --config "$TUNNEL_CONFIG" run >> "$TUNNEL_LOG" 2>&1 &
        TUNNEL_PID=$!
        echo $TUNNEL_PID > "$TUNNEL_PID_FILE"
        sleep 3
        if kill -0 "$TUNNEL_PID" > /dev/null 2>&1; then
            echo "  ✅ Tunnel started (PID $TUNNEL_PID)"
        else
            echo "  ❌ Tunnel failed to start"
            echo "  📋 Log: $TUNNEL_LOG"
            rm -f "$TUNNEL_PID_FILE"
        fi
    fi
fi

# ─── SUMMARY ────────────────────────────────────────────────────────────────
echo ""
echo "==========================================="
echo "✅ CoSheet is UP"
echo "  Local:  http://localhost:$PORT/"
echo "  Public: https://cosheet.truyenthong.edu.vn/"
echo ""
echo "📋 Logs:"
echo "  App:    $COSHEET_LOG"
echo "  Tunnel: $TUNNEL_LOG"
echo "  Redis:  /tmp/redis-cosheet.log"
echo ""
echo "  Run './statusMac.sh' for details"

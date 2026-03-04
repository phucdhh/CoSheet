#!/bin/bash
# Stop CoSheet on Mac Mini (no Docker)

COSHEET_PID_FILE="/tmp/cosheet-app.pid"
TUNNEL_PID_FILE="/tmp/cosheet-tunnel.pid"
STOP_REDIS=false

echo "🛑 Stopping CoSheet (Mac Mini)"
echo "================================"
echo ""

# Optional: stop Redis if --with-redis flag passed
if [[ "$1" == "--with-redis" ]]; then
    STOP_REDIS=true
fi

# ─── 1. CLOUDFLARE TUNNEL ───────────────────────────────────────────────────
echo "🌐 [1/2] Stopping Cloudflare Tunnel..."
STOPPED_TUNNEL=false

if [ -f "$TUNNEL_PID_FILE" ]; then
    TUNNEL_PID=$(cat "$TUNNEL_PID_FILE")
    if kill -0 "$TUNNEL_PID" > /dev/null 2>&1; then
        kill "$TUNNEL_PID" 2>/dev/null
        sleep 1
        if ! kill -0 "$TUNNEL_PID" > /dev/null 2>&1; then
            echo "  ✅ Tunnel stopped (PID $TUNNEL_PID)"
            STOPPED_TUNNEL=true
        else
            kill -9 "$TUNNEL_PID" 2>/dev/null
            echo "  ✅ Tunnel force-stopped (PID $TUNNEL_PID)"
            STOPPED_TUNNEL=true
        fi
    else
        echo "  ℹ️  Tunnel was not running (stale PID $TUNNEL_PID)"
        STOPPED_TUNNEL=true
    fi
    rm -f "$TUNNEL_PID_FILE"
else
    # Fallback: find by process name
    PIDS=$(pgrep -f "config-cosheet.yml" 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "  ▶  Found tunnel process(es): $PIDS"
        echo "$PIDS" | xargs kill 2>/dev/null
        sleep 1
        echo "  ✅ Tunnel stopped"
        STOPPED_TUNNEL=true
    else
        echo "  ℹ️  Tunnel not running"
    fi
fi

# ─── 2. COSHEET APP ─────────────────────────────────────────────────────────
echo ""
echo "📊 [2/2] Stopping CoSheet app..."

if [ -f "$COSHEET_PID_FILE" ]; then
    COSHEET_PID=$(cat "$COSHEET_PID_FILE")
    if kill -0 "$COSHEET_PID" > /dev/null 2>&1; then
        kill "$COSHEET_PID" 2>/dev/null
        sleep 2
        if ! kill -0 "$COSHEET_PID" > /dev/null 2>&1; then
            echo "  ✅ CoSheet stopped (PID $COSHEET_PID)"
        else
            kill -9 "$COSHEET_PID" 2>/dev/null
            echo "  ✅ CoSheet force-stopped (PID $COSHEET_PID)"
        fi
    else
        echo "  ℹ️  CoSheet was not running (stale PID $COSHEET_PID)"
    fi
    rm -f "$COSHEET_PID_FILE"
else
    # Fallback: find node app.js process in CoSheet dir
    PIDS=$(pgrep -f "node.*app\.js" 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "  ▶  Found CoSheet process(es): $PIDS"
        echo "$PIDS" | xargs kill 2>/dev/null
        sleep 1
        echo "  ✅ CoSheet stopped"
    else
        echo "  ℹ️  CoSheet not running"
    fi
fi

# ─── REDIS (optional) ────────────────────────────────────────────────────────
echo ""
if $STOP_REDIS; then
    echo "🔴 Stopping Redis..."
    if redis-cli ping > /dev/null 2>&1; then
        redis-cli shutdown nosave > /dev/null 2>&1 || true
        sleep 1
        if ! redis-cli ping > /dev/null 2>&1; then
            echo "  ✅ Redis stopped"
        else
            pkill -f redis-server 2>/dev/null
            echo "  ✅ Redis force-stopped"
        fi
    else
        echo "  ℹ️  Redis was not running"
    fi
    echo ""
fi

echo "================================"
echo "✅ CoSheet is DOWN"
if ! $STOP_REDIS; then
    echo "  ℹ️  Redis is still running (use '--with-redis' to also stop Redis)"
fi
echo ""
echo "  Run './startMac.sh' to start again"

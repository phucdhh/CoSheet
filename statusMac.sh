#!/bin/bash
# CoSheet status on Mac Mini (no Docker)

PORT="5234"
COSHEET_PID_FILE="/tmp/cosheet-app.pid"
TUNNEL_PID_FILE="/tmp/cosheet-tunnel.pid"
COSHEET_LOG="/tmp/cosheet-app.log"
TUNNEL_LOG="/tmp/cosheet-tunnel.log"

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
RESET="\033[0m"

ok()   { echo -e "  ${GREEN}✅  $*${RESET}"; }
fail() { echo -e "  ${RED}❌  $*${RESET}"; }
warn() { echo -e "  ${YELLOW}⚠️   $*${RESET}"; }

echo "📊 CoSheet Status — Mac Mini"
echo "=============================="
echo ""

ALL_OK=true

# ─── REDIS ──────────────────────────────────────────────────────────────────
echo "🔴 Redis"
if redis-cli ping > /dev/null 2>&1; then
    REDIS_INFO=$(redis-cli info server 2>/dev/null | grep "redis_version" | cut -d: -f2 | tr -d '[:space:]')
    REDIS_MEM=$(redis-cli info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '[:space:]')
    REDIS_KEYS=$(redis-cli dbsize 2>/dev/null)
    ok "Running (v${REDIS_INFO})"
    echo "    Memory: ${REDIS_MEM}   Keys: ${REDIS_KEYS}"
else
    fail "Not running"
    ALL_OK=false
fi
echo ""

# ─── COSHEET APP ─────────────────────────────────────────────────────────────
echo "📊 CoSheet App"
COSHEET_RUNNING=false

if [ -f "$COSHEET_PID_FILE" ]; then
    COSHEET_PID=$(cat "$COSHEET_PID_FILE")
    if kill -0 "$COSHEET_PID" > /dev/null 2>&1; then
        COSHEET_RUNNING=true
        UPTIME=$(ps -p "$COSHEET_PID" -o etime= 2>/dev/null | tr -d ' ')
        RSS_KB=$(ps -p "$COSHEET_PID" -o rss= 2>/dev/null | tr -d ' ')
        RSS_MB=$((${RSS_KB:-0} / 1024))
        CPU=$(ps -p "$COSHEET_PID" -o %cpu= 2>/dev/null | tr -d ' ')
        ok "Running (PID $COSHEET_PID)"
        echo "    Uptime: ${UPTIME}   Memory: ${RSS_MB}MB   CPU: ${CPU}%"
    else
        fail "Not running (stale PID $COSHEET_PID)"
        rm -f "$COSHEET_PID_FILE"
        ALL_OK=false
    fi
else
    # Fallback check
    FALLBACK_PID=$(pgrep -f "node.*app\.js" 2>/dev/null | head -1)
    if [ -n "$FALLBACK_PID" ]; then
        COSHEET_RUNNING=true
        warn "Running (PID $FALLBACK_PID, no PID file)"
    else
        fail "Not running"
        ALL_OK=false
    fi
fi

# HTTP health check
if $COSHEET_RUNNING; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$PORT/ 2>/dev/null)
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 http://127.0.0.1:$PORT/ 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        ok "HTTP $HTTP_CODE — http://localhost:$PORT/  (${RESPONSE_TIME}s)"
    else
        warn "HTTP $HTTP_CODE — http://localhost:$PORT/"
    fi
fi
echo ""

# ─── CLOUDFLARE TUNNEL ──────────────────────────────────────────────────────
echo "🌐 Cloudflare Tunnel"
TUNNEL_RUNNING=false

if [ -f "$TUNNEL_PID_FILE" ]; then
    TUNNEL_PID=$(cat "$TUNNEL_PID_FILE")
    if kill -0 "$TUNNEL_PID" > /dev/null 2>&1; then
        TUNNEL_RUNNING=true
        UPTIME=$(ps -p "$TUNNEL_PID" -o etime= 2>/dev/null | tr -d ' ')
        RSS_KB=$(ps -p "$TUNNEL_PID" -o rss= 2>/dev/null | tr -d ' ')
        RSS_MB=$((${RSS_KB:-0} / 1024))
        ok "Running (PID $TUNNEL_PID)"
        echo "    Uptime: ${UPTIME}   Memory: ${RSS_MB}MB"
    else
        fail "Not running (stale PID $TUNNEL_PID)"
        rm -f "$TUNNEL_PID_FILE"
        ALL_OK=false
    fi
else
    FALLBACK_PID=$(pgrep -f "config-cosheet.yml" 2>/dev/null | head -1)
    if [ -n "$FALLBACK_PID" ]; then
        TUNNEL_RUNNING=true
        warn "Running (PID $FALLBACK_PID, no PID file)"
    else
        fail "Not running"
        ALL_OK=false
    fi
fi

if $TUNNEL_RUNNING; then
    ok "Route: cosheet.truyenthong.edu.vn → http://127.0.0.1:$PORT"
fi
echo ""

# ─── RECENT LOGS ────────────────────────────────────────────────────────────
if [[ "$1" == "--logs" || "$1" == "-l" ]]; then
    echo "📋 Recent App Logs (last 15 lines)"
    echo "────────────────────────────────────────"
    if [ -f "$COSHEET_LOG" ]; then
        tail -15 "$COSHEET_LOG" | sed 's/^/  /'
    else
        echo "  (no log file found)"
    fi
    echo ""

    echo "📋 Recent Tunnel Logs (last 10 lines)"
    echo "────────────────────────────────────────"
    if [ -f "$TUNNEL_LOG" ]; then
        tail -10 "$TUNNEL_LOG" | sed 's/^/  /'
    else
        echo "  (no log file found)"
    fi
    echo ""
fi

# ─── SUMMARY ─────────────────────────────────────────────────────────────────
echo "=============================="
if $ALL_OK; then
    echo -e "${GREEN}✅  All systems operational${RESET}"
else
    echo -e "${RED}❌  Some services are down — run './startMac.sh' to fix${RESET}"
fi
echo ""
echo "  Local:  http://localhost:$PORT/"
echo "  Public: https://cosheet.truyenthong.edu.vn/"
echo ""
echo "💡 Commands:"
echo "  ./startMac.sh          — Start all services"
echo "  ./stopMac.sh           — Stop app + tunnel (keep Redis)"
echo "  ./stopMac.sh --with-redis  — Stop everything"
echo "  ./restartMac.sh        — Restart all"
echo "  ./statusMac.sh --logs  — Show this + recent logs"

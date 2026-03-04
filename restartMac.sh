#!/bin/bash
# Restart CoSheet on Mac Mini (no Docker)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔄 Restarting CoSheet (Mac Mini)"
echo "=================================="
echo ""

# Stop
bash "$SCRIPT_DIR/stopMac.sh"

echo ""
echo "⏳ Waiting 2s before starting..."
sleep 2
echo ""

# Start
bash "$SCRIPT_DIR/startMac.sh"

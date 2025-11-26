#!/bin/bash

# Script to test Chrome CDP connection and website
# This script creates an SSH tunnel to iMac's Chrome CDP and tests the website

echo "=== Chrome CDP Connection Test ==="
echo ""

# Check if we can reach iMac
echo "1. Testing network connectivity to iMac..."
if ping -c 1 -W 2 192.168.1.16 > /dev/null 2>&1; then
    echo "   ✓ iMac is reachable at 192.168.1.16"
else
    echo "   ✗ Cannot reach iMac at 192.168.1.16"
    exit 1
fi

# Check if SSH tunnel already exists
echo ""
echo "2. Checking for existing SSH tunnel..."
if ps aux | grep -v grep | grep "ssh.*9222:localhost:9222" > /dev/null; then
    echo "   ✓ SSH tunnel already exists"
    TUNNEL_PID=$(ps aux | grep -v grep | grep "ssh.*9222:localhost:9222" | awk '{print $2}')
    echo "   Tunnel PID: $TUNNEL_PID"
else
    echo "   ✗ No SSH tunnel found"
    echo "   Please create tunnel manually with:"
    echo "   ssh -L 9222:localhost:9222 imac@192.168.1.16 -N"
fi

# Test connection to Chrome CDP
echo ""
echo "3. Testing Chrome CDP connection..."
if curl -s --max-time 3 http://localhost:9222/json/version > /dev/null 2>&1; then
    echo "   ✓ Chrome CDP is accessible"
    echo ""
    echo "   Chrome version info:"
    curl -s http://localhost:9222/json/version | python3 -m json.tool 2>/dev/null || curl -s http://localhost:9222/json/version
else
    echo "   ✗ Cannot connect to Chrome CDP at localhost:9222"
    echo "   Make sure:"
    echo "   - Chrome is running on iMac with --remote-debugging-port=9222"
    echo "   - SSH tunnel is established"
    exit 1
fi

# List available pages
echo ""
echo "4. Listing available Chrome pages/tabs..."
curl -s http://localhost:9222/json/list | python3 -m json.tool 2>/dev/null | head -20 || curl -s http://localhost:9222/json/list | head -20

echo ""
echo "=== Test Complete ==="
echo ""
echo "To test the website https://dulieu.truyenthong.edu.vn:"
echo "1. Make sure Chrome is running on iMac with CDP enabled"
echo "2. Ensure SSH tunnel is active: ssh -L 9222:localhost:9222 imac@192.168.1.16 -N"
echo "3. Use browser automation tools to connect to localhost:9222"

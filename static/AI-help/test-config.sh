#!/bin/bash
# Test AI Assistant Configuration

echo "========================================="
echo "AI Assistant Configuration Test"
echo "========================================="
echo ""

# Check if ai.conf exists
if [ ! -f "/root/ethercalc/static/AI-help/ai.conf" ]; then
    echo "❌ ERROR: ai.conf file not found!"
    echo "   Please copy ai.conf.template to ai.conf and add your API key"
    exit 1
fi

echo "✓ ai.conf file exists"
echo ""

# Check if it's valid JSON
if ! jq empty /root/ethercalc/static/AI-help/ai.conf 2>/dev/null; then
    echo "❌ ERROR: ai.conf is not valid JSON!"
    echo "   Please check the syntax at https://jsonlint.com/"
    exit 1
fi

echo "✓ ai.conf is valid JSON"
echo ""

# Read configuration
API_KEY=$(jq -r '.apiKey' /root/ethercalc/static/AI-help/ai.conf)
ENABLED=$(jq -r '.enabled' /root/ethercalc/static/AI-help/ai.conf)
MODEL=$(jq -r '.model' /root/ethercalc/static/AI-help/ai.conf)

# Check if API key is configured
if [ "$API_KEY" = "YOUR_GROQ_API_KEY_HERE" ] || [ -z "$API_KEY" ]; then
    echo "❌ ERROR: API key not configured!"
    echo "   Please replace YOUR_GROQ_API_KEY_HERE with your actual Groq API key"
    echo "   Get one for free at: https://console.groq.com/"
    exit 1
fi

echo "✓ API key is configured (${API_KEY:0:10}...)"
echo ""

# Check if enabled
if [ "$ENABLED" != "true" ]; then
    echo "⚠️  WARNING: AI Assistant is disabled in config"
    echo "   Set 'enabled': true in ai.conf to enable"
fi

echo "✓ Enabled: $ENABLED"
echo "✓ Model: $MODEL"
echo ""

# Test API connection
echo "Testing API connection..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "'$MODEL'",
        "messages": [
            {"role": "user", "content": "Say OK"}
        ],
        "max_tokens": 10
    }' \
    https://api.groq.com/openai/v1/chat/completions)

if [ "$RESPONSE" = "200" ]; then
    echo "✓ API connection successful!"
    echo ""
    echo "========================================="
    echo "✅ All checks passed!"
    echo "AI Assistant is ready to use."
    echo "========================================="
else
    echo "❌ API connection failed (HTTP $RESPONSE)"
    echo "   Please check:"
    echo "   - API key is valid"
    echo "   - Internet connection is working"
    echo "   - Groq service is not down"
fi

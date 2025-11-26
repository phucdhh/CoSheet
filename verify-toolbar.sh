#!/bin/bash
# Quick verification script for format toolbar implementation

echo "=== Format Toolbar Implementation Verification ==="
echo ""

# Check if files exist
echo "✓ Checking if files exist..."
if [ -f "static/format-toolbar.css" ] && [ -f "static/format-toolbar.js" ]; then
    echo "  ✅ CSS file: $(ls -sh static/format-toolbar.css)"
    echo "  ✅ JS file: $(ls -sh static/format-toolbar.js)"
else
    echo "  ❌ Files missing!"
    exit 1
fi

# Check if index.html includes the files
echo ""
echo "✓ Checking index.html references..."
if grep -q "format-toolbar.css" index.html && grep -q "format-toolbar.js" index.html; then
    echo "  ✅ format-toolbar.css referenced in index.html"
    echo "  ✅ format-toolbar.js referenced in index.html"
else
    echo "  ❌ References missing in index.html!"
    exit 1
fi

# Check if server is running
echo ""
echo "✓ Checking if server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200"; then
    echo "  ✅ Server is running on http://localhost:8000"
else
    echo "  ❌ Server not responding!"
    exit 1
fi

echo ""
echo "=== ✅ All checks passed! ==="
echo ""
echo "📋 MANUAL TESTING STEPS:"
echo "1. Open Chrome browser"
echo "2. Navigate to: http://localhost:8000"
echo "3. Look for format toolbar at TOP of page"
echo "4. Verify spreadsheet is visible BELOW toolbar"
echo "5. Test formatting controls:"
echo "   - Click Bold button"
echo "   - Change font size"
echo "   - Pick a text color"
echo "   - Test alignment buttons"
echo ""
echo "Expected result: Spreadsheet stays visible while formatting!"

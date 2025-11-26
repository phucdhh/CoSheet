#!/bin/bash
# Post-install script to apply SocialCalc patches
# This fixes the "document is not defined" error in server-side context

echo "Applying SocialCalc patches..."

# Check if patches directory exists
if [ ! -d "patches" ]; then
    echo "Error: patches directory not found"
    exit 1
fi

# Apply source patch
if [ -f "patches/socialcalcspreadsheetcontrol.js.patched" ]; then
    cp patches/socialcalcspreadsheetcontrol.js.patched node_modules/socialcalc/js/socialcalcspreadsheetcontrol.js
    echo "✓ Applied socialcalcspreadsheetcontrol.js patch"
else
    echo "Warning: socialcalcspreadsheetcontrol.js.patched not found"
fi

# Apply dist patch
if [ -f "patches/SocialCalc.js.patched" ]; then
    cp patches/SocialCalc.js.patched node_modules/socialcalc/dist/SocialCalc.js
    echo "✓ Applied SocialCalc.js patch"
else
    echo "Warning: SocialCalc.js.patched not found"
fi

echo "Patches applied successfully!"

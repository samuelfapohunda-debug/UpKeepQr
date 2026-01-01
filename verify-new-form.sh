#!/bin/bash

echo "========================================="
echo "🧪 Verifying New Form Deployment"
echo "========================================="
echo ""

URL="https://upkeepqr.com/setup/76FlY1JmXl8P"

echo "Testing $URL..."
echo ""

# Since it's client-side rendered, check the JS bundle
BUNDLE_URL=$(curl -s "$URL" | grep -o 'src="/assets/index-[^"]*\.js"' | sed 's|src="||' | sed 's|"||')

if [ -n "$BUNDLE_URL" ]; then
    FULL_BUNDLE="https://upkeepqr.com$BUNDLE_URL"
    echo "Checking bundle: $FULL_BUNDLE"
    echo ""
    
    curl -s "$FULL_BUNDLE" > /tmp/bundle.js
    
    echo "Looking for new form code..."
    grep -q "Step 1 of 4" /tmp/bundle.js && echo "✅ 'Step 1 of 4' found" || echo "❌ Not found"
    grep -q "Complete Your Home Setup" /tmp/bundle.js && echo "✅ 'Complete Your Home Setup' found" || echo "❌ Not found"
    grep -q "ProgressIndicator" /tmp/bundle.js && echo "✅ ProgressIndicator component found" || echo "❌ Not found"
    
    echo ""
    echo "Looking for old form code..."
    grep -q "Personal Detail" /tmp/bundle.js && echo "⚠️  'Personal Detail' still in bundle" || echo "✅ Old 'Personal Detail' removed"
    grep -q "Interests & Needs" /tmp/bundle.js && echo "⚠️  'Interests & Needs' still in bundle" || echo "✅ Old section removed"
    
    rm /tmp/bundle.js
else
    echo "❌ Could not find bundle URL"
fi

echo ""
echo "========================================="
echo "🌐 MANUAL TEST REQUIRED"
echo "========================================="
echo "Open in browser: $URL"
echo ""
echo "Hard refresh (Ctrl+Shift+R) and verify:"
echo "  ☐ See 'Step 1 of 4'"
echo "  ☐ See visual home type cards"
echo "  ☐ See progress bar"
echo "  ☐ NO 'Personal Detail' section"
echo "  ☐ NO 'Interests & Needs' section"
echo "========================================="

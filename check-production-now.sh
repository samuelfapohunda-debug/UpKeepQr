#!/bin/bash

echo "========================================="
echo "🧪 PRODUCTION CHECK"
echo "========================================="
echo ""

URL="https://upkeepqr.com/setup/76FlY1JmXl8P"

echo "1️⃣ Fetching page..."
PAGE_CONTENT=$(curl -s "$URL")

echo "2️⃣ Finding bundle URL..."
BUNDLE_URL=$(echo "$PAGE_CONTENT" | grep -o '/assets/index-[^"]*\.js' | head -1)

if [ -n "$BUNDLE_URL" ]; then
    FULL_BUNDLE="https://upkeepqr.com$BUNDLE_URL"
    echo "   Bundle: $FULL_BUNDLE"
    echo ""
    
    echo "3️⃣ Downloading bundle..."
    curl -s "$FULL_BUNDLE" > /tmp/prod-bundle.js
    BUNDLE_SIZE=$(wc -c < /tmp/prod-bundle.js)
    echo "   Size: $BUNDLE_SIZE bytes"
    echo ""
    
    echo "4️⃣ Checking for NEW form code..."
    grep -q "What type of home do you have" /tmp/prod-bundle.js && echo "   ✅ Home type question found" || echo "   ❌ NOT found"
    grep -q "Step 1 of 4" /tmp/prod-bundle.js && echo "   ✅ Step indicator found" || echo "   ❌ NOT found"
    grep -q "ProgressIndicator" /tmp/prod-bundle.js && echo "   ✅ ProgressIndicator found" || echo "   ❌ NOT found"
    
    echo ""
    echo "5️⃣ Checking for OLD form code..."
    grep -q "Personal Detail" /tmp/prod-bundle.js && echo "   ⚠️  OLD: Personal Detail found" || echo "   ✅ Personal Detail removed"
    grep -q "Interests & Needs" /tmp/prod-bundle.js && echo "   ⚠️  OLD: Interests section found" || echo "   ✅ Interests section removed"
    
    rm /tmp/prod-bundle.js
else
    echo "   ❌ Could not find bundle URL"
fi

echo ""
echo "========================================="
echo "📊 RENDER DEPLOYMENT STATUS"
echo "========================================="
echo "Check logs at:"
echo "https://dashboard.render.com/web/srv-d4jtmm49c44c73eioqc0/logs"
echo ""
echo "Look for commit: 50f1f7a"
echo "Status should be: 'Deploy succeeded'"
echo "========================================="

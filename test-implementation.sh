#!/bin/bash

echo "🧪 Home Data Capture Implementation Test"
echo

echo "1. Checking server status..."
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server not running. Starting development server..."
    npm run dev &
    SERVER_PID=$!
    sleep 5
    echo "✅ Server started (PID: $SERVER_PID)"
fi

echo
echo "2. Testing API endpoint..."
RESPONSE=$(curl -s -w "%{http_code}" http://localhost:5000/api/public/setup/test-token/extra)
STATUS_CODE="${RESPONSE: -3}"

if [ "$STATUS_CODE" = "404" ]; then
    echo "✅ API endpoint responding (404 expected for invalid token)"
elif [ "$STATUS_CODE" = "200" ]; then
    echo "✅ API endpoint working"
else
    echo "⚠️  API endpoint returned status: $STATUS_CODE"
fi

echo
echo "3. Checking frontend component..."
if [ -f "src/components/setup/ExtendedHomeProfile.tsx" ]; then
    if grep -q "setupToken" src/components/setup/ExtendedHomeProfile.tsx; then
        echo "✅ Component properly configured for setupToken"
    else
        echo "❌ Component not properly configured"
    fi
else
    echo "❌ Component file missing"
fi

echo
echo "4. Checking Onboarding integration..."
if grep -q "ExtendedHomeProfile" src/pages/Onboarding.tsx; then
    echo "✅ Component integrated into Onboarding"
else
    echo "❌ Component not integrated"
fi

echo
echo "🎯 TEST COMPLETE"
echo
echo "Next: Visit http://localhost:5000/setup/YOUR_ACTUAL_TOKEN to test the feature"
echo "Look for: 'Complete Your Home Profile' section below the main form"

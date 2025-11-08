#!/bin/bash

echo "🧪 Home Extra Feature Test Script"
echo

# Check if server is running
echo "1. Checking if server is running..."
curl -s http://localhost:5000/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Start with: npm run dev"
    exit 1
fi

# Test public API endpoint structure
echo
echo "2. Testing API endpoint structure..."
curl -s http://localhost:5000/api/public/setup/test-token/extra | grep -q "error\|success"
if [ $? -eq 0 ]; then
    echo "✅ Public API endpoint is accessible"
else
    echo "⚠️  API endpoint may not be properly configured"
fi

# Check if component is properly exported
echo
echo "3. Checking component exports..."
if [ -f "src/components/setup/ExtendedHomeProfile.tsx" ]; then
    echo "✅ ExtendedHomeProfile component exists"
    if grep -q "export default" src/components/setup/ExtendedHomeProfile.tsx; then
        echo "✅ Component is properly exported"
    else
        echo "❌ Component missing export default"
    fi
fi

echo
echo "🎯 Test completed!"
echo "To fully test:"
echo "1. Use a real magnet token in the URL"
echo "2. The 'Complete Your Home Profile' section should appear"
echo "3. Form data should save successfully"
echo "4. Check browser console and server logs for analytics"

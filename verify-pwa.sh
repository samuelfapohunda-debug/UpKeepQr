#!/bin/bash
echo "⏳ Waiting 30 seconds for deployment to settle..."
sleep 30

echo ""
echo "🧪 Testing PWA Deployment..."
echo "=============================="
echo ""

# Quick manifest check
echo -n "Checking manifest.json... "
MANIFEST=$(curl -s https://maintcue.com/manifest.json | jq -r '.name' 2>/dev/null)
if [ "$MANIFEST" = "MaintCue - Home Maintenance Tracker" ]; then
  echo "✅ DEPLOYED"
else
  echo "❌ FAILED"
fi

# Quick service worker check
echo -n "Checking sw.js... "
if curl -s https://maintcue.com/sw.js | grep -q "BUILD_VERSION"; then
  echo "✅ DEPLOYED"
else
  echo "❌ FAILED"
fi

# Quick icon check
echo -n "Checking icons... "
if curl -sf https://maintcue.com/icons/icon-192x192.png > /dev/null; then
  echo "✅ DEPLOYED"
else
  echo "❌ FAILED"
fi

echo ""
echo "Running full test suite..."
echo ""
./test-pwa.sh

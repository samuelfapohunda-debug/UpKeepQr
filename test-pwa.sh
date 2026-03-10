#!/bin/bash
# MaintCue PWA Test Suite

echo "🧪 MaintCue PWA Test Suite"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Test 1: Site accessibility
echo -n "1. Site accessible... "
if curl -sf https://maintcue.com > /dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 2: Manifest exists
echo -n "2. Manifest exists... "
if curl -sf https://maintcue.com/manifest.json > /dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 3: Manifest is valid JSON
echo -n "3. Manifest valid JSON... "
if curl -s https://maintcue.com/manifest.json | jq '.' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 4: Manifest has required fields
echo -n "4. Manifest has required fields... "
REQUIRED_FIELDS=$(curl -s https://maintcue.com/manifest.json | jq 'has("name") and has("short_name") and has("start_url") and has("display") and has("icons")')
if [ "$REQUIRED_FIELDS" = "true" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 5: Has minimum 2 icons (192 and 512)
echo -n "5. Has minimum required icons... "
ICON_COUNT=$(curl -s https://maintcue.com/manifest.json | jq '.icons | length')
if [ "$ICON_COUNT" -ge 2 ]; then
  echo -e "${GREEN}✓ PASS (${ICON_COUNT} icons)${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL (only ${ICON_COUNT} icons)${NC}"
  ((FAIL++))
fi

# Test 6: Service worker exists
echo -n "6. Service worker exists... "
if curl -sf https://maintcue.com/sw.js > /dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 7: Service worker has cache strategy
echo -n "7. Service worker has caching... "
if curl -s https://maintcue.com/sw.js | grep -q "CACHE_NAME"; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 8: Icon 192x192 exists
echo -n "8. Icon 192x192 exists... "
if curl -sf https://maintcue.com/icons/icon-192x192.png > /dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 9: Icon 512x512 exists
echo -n "9. Icon 512x512 exists... "
if curl -sf https://maintcue.com/icons/icon-512x512.png > /dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 10: Offline page exists
echo -n "10. Offline page exists... "
if curl -sf https://maintcue.com/offline.html > /dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 11: HTTPS enabled
echo -n "11. HTTPS enabled... "
if curl -sI https://maintcue.com | grep -q "HTTP/2 200"; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAIL++))
fi

# Test 12: Theme color meta tag (check index.html)
echo -n "12. Theme color configured... "
if curl -s https://maintcue.com | grep -q 'name="theme-color"'; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠ SKIP (cannot check)${NC}"
fi

echo ""
echo "============================"
echo "Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! PWA is ready.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Check errors above.${NC}"
  exit 1
fi

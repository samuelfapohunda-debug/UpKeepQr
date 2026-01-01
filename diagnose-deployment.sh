#!/bin/bash

echo "========================================="
echo "🔍 DEPLOYMENT DIAGNOSTIC"
echo "========================================="
echo ""

echo "1️⃣  Checking local files..."
echo "   SetupForm.tsx exists:"
ls client/src/pages/SetupForm.tsx 2>/dev/null && echo "   ✅ Yes" || echo "   ❌ No"

echo ""
echo "   Onboarding components exist:"
ls client/src/components/onboarding/*.tsx 2>/dev/null | wc -l | xargs echo "   Found: " 
ls client/src/components/onboarding/*.tsx 2>/dev/null

echo ""
echo "2️⃣  Checking App.tsx routing..."
echo "   SetupForm import:"
grep "import.*SetupForm" client/src/App.tsx || echo "   ❌ Not found"

echo ""
echo "   Setup route:"
grep -A 2 "setup.*token\|/setup/:" client/src/App.tsx || echo "   ❌ Not found"

echo ""
echo "3️⃣  Checking what's actually deployed..."
CONTENT=$(curl -s https://upkeepqr.com/setup/76FlY1JmXl8P)

echo "   Looking for old form sections:"
echo "$CONTENT" | grep -q "Personal Detail" && echo "   ⚠️  OLD: Personal Detail found" || echo "   ✅ Personal Detail not found"
echo "$CONTENT" | grep -q "Home Detail" && echo "   ⚠️  OLD: Home Detail found" || echo "   ✅ Home Detail not found"
echo "$CONTENT" | grep -q "Interests & Needs" && echo "   ⚠️  OLD: Interests & Needs found" || echo "   ✅ Interests & Needs not found"

echo ""
echo "   Looking for new form elements:"
echo "$CONTENT" | grep -q "Step 1 of 4" && echo "   ✅ NEW: Progress indicator found" || echo "   ❌ Progress indicator not found"
echo "$CONTENT" | grep -q "Complete Your Home Setup" && echo "   ✅ NEW: New header found" || echo "   ❌ New header not found"

echo ""
echo "4️⃣  Checking git status..."
git log --oneline -3

echo ""
echo "5️⃣  Checking what form component is used..."
echo "   First 50 lines of App.tsx:"
head -50 client/src/App.tsx

echo ""
echo "========================================="
echo "DIAGNOSIS COMPLETE"
echo "========================================="

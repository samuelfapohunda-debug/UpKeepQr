#!/bin/bash

echo "========================================="
echo "🔍 Complete SetupForm Check"
echo "========================================="
echo ""

echo "1️⃣  File info:"
ls -lh client/src/pages/SetupForm.tsx

echo ""
echo "2️⃣  First 100 lines of SetupForm.tsx:"
head -100 client/src/pages/SetupForm.tsx

echo ""
echo "3️⃣  Does SetupForm import Onboarding?"
grep -i "onboarding" client/src/pages/SetupForm.tsx || echo "No Onboarding imports found"

echo ""
echo "4️⃣  Default export:"
tail -20 client/src/pages/SetupForm.tsx | grep -A 5 "export"

echo ""
echo "5️⃣  What was committed to git?"
git show HEAD:client/src/pages/SetupForm.tsx | head -50

echo ""
echo "========================================="

#!/bin/bash

echo "========================================="
echo "🔍 Finding Form Display Issue"
echo "========================================="
echo ""

echo "1️⃣  Which component is on /setup/:token?"
echo ""
grep -A 2 'path="/setup/:token"' client/src/App.tsx

echo ""
echo "2️⃣  What's in Onboarding.tsx (old form)?"
echo ""
head -30 client/src/pages/Onboarding.tsx

echo ""
echo "3️⃣  What's in SetupForm.tsx (new form)?"
echo ""
head -30 client/src/pages/SetupForm.tsx

echo ""
echo "4️⃣  Are there multiple /setup routes?"
echo ""
grep "/setup" client/src/App.tsx

echo ""
echo "========================================="

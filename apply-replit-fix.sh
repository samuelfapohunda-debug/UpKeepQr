#!/bin/bash

echo "Applying Replit agent's fix to App.tsx..."

# Backup first
cp client/src/App.tsx client/src/App.tsx.before-replit-fix

# Remove the commented Onboarding import line completely
sed -i '/^\/\/ import Onboarding from/d' client/src/App.tsx

# Also remove if it's not commented (just in case)
sed -i '/^import Onboarding from/d' client/src/App.tsx

echo "✅ Removed Onboarding import"
echo ""
echo "Verification:"
echo "Onboarding references remaining:"
grep -n "Onboarding" client/src/App.tsx || echo "  ✅ None found (perfect!)"

echo ""
echo "SetupForm import:"
grep -n "SetupForm" client/src/App.tsx


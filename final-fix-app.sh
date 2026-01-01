#!/bin/bash

echo "Removing Onboarding route - Bash version..."

# Backup
cp client/src/App.tsx client/src/App.tsx.backup4

# Use awk to skip the route block
awk '
/<Route path="\/setup\/new">/ { skip=1 }
skip && /<\/Route>/ { skip=0; next }
!skip { print }
' client/src/App.tsx.backup4 > client/src/App.tsx

echo "✅ Route removed"
echo ""
echo "Verification:"
grep -n "setup/new" client/src/App.tsx || echo "✅ /setup/new route successfully removed"
echo ""
echo "Remaining Onboarding references:"
grep -n "Onboarding" client/src/App.tsx


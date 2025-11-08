#!/bin/bash
cd /workspaces/UpKeepQr

echo "=== 1. FIND SETUP PAGE FILE ==="
find client/src -type f -iname "*setup*"

echo ""
echo "=== 2. CHECK APP.TSX ROUTES ==="
grep -n -i "setup\|route" client/src/App.tsx | head -30

echo ""
echo "=== 3. SHOW SETUP PAGE CONTENT ==="
if [ -f "client/src/pages/Setup.tsx" ]; then
    cat client/src/pages/Setup.tsx
else
    echo "❌ Setup.tsx not found"
fi

echo ""
echo "=== 4. CHECK SETUP PAGE IMPORTS ==="
if [ -f "client/src/pages/Setup.tsx" ]; then
    echo "Checking if all imports are installed..."
    grep "^import.*from ['\"]" client/src/pages/Setup.tsx | \
        sed "s/.*from ['\"]//g" | sed "s/['\"].*//g" | \
        grep -v "^[./]" | grep -v "^@" | sort | uniq | \
        while read pkg; do
            if npm list "$pkg" 2>&1 | grep -q "empty"; then
                echo "❌ MISSING: $pkg"
            else
                echo "✅ OK: $pkg"
            fi
        done
fi

echo ""
echo "=== 5. CHECK FOR TYPESCRIPT/SYNTAX ERRORS ==="
if [ -f "client/src/pages/Setup.tsx" ]; then
    echo "First 50 lines of Setup.tsx:"
    head -50 client/src/pages/Setup.tsx
fi

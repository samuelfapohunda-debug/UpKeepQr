#!/bin/bash
cd /workspaces/UpKeepQr

echo "=== 1. ALL THIRD-PARTY IMPORTS IN CLIENT CODE ==="
find client/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -h "^import.*from ['\"]" {} \; | \
    sed "s/.*from ['\"]//g" | sed "s/['\"].*//g" | \
    grep -v "^[./]" | grep -v "^@" | \
    sort | uniq

echo ""
echo "=== 2. CHECK COMMON PACKAGES ==="
for pkg in react react-dom react-router-dom @tanstack/react-query axios lucide-react recharts; do
    if npm list "$pkg" 2>&1 | grep -q "empty"; then
        echo "❌ MISSING: $pkg"
    else
        echo "✅ INSTALLED: $pkg"
    fi
done

echo ""
echo "=== 3. CHECK ENTRY POINTS ==="
echo "--- main.tsx ---"
cat client/src/main.tsx 2>/dev/null || echo "❌ Not found"
echo ""
echo "--- index.html ---"
cat client/index.html 2>/dev/null || echo "❌ Not found"

echo ""
echo "=== 4. CURRENT DEPENDENCIES ==="
grep -A 50 '"dependencies"' package.json | grep -B 50 '"devDependencies"'

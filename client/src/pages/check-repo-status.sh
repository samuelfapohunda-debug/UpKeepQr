#!/bin/bash

echo "🔍 UpKeepQr Repository Quick Status Check"
echo "=========================================="

# Check basic structure
echo -e "\n📁 Project Structure:"
[ -d "client" ] && echo "✅ Client directory exists" || echo "❌ Client directory missing"
[ -d "server" ] && echo "✅ Server directory exists" || echo "❌ Server directory missing"
[ -d "client/src/components" ] && echo "✅ Components directory exists" || echo "❌ Components directory missing"
[ -d "client/src/pages" ] && echo "✅ Pages directory exists" || echo "❌ Pages directory missing"

# Check key files
echo -e "\n📄 Key Files:"
[ -f "client/package.json" ] && echo "✅ Client package.json exists" || echo "❌ Client package.json missing"
[ -f "README.md" ] && echo "✅ README exists" || echo "❌ README missing"
[ -f "tsconfig.json" ] && echo "✅ TypeScript config exists" || echo "❌ TypeScript config missing"

# Count components and pages
echo -e "\n📊 Component Count:"
if [ -d "client/src/components" ]; then
    comp_count=$(find client/src/components -name "*.tsx" -o -name "*.jsx" | wc -l)
    echo "✅ $comp_count React components found"
else
    echo "❌ No components directory"
fi

if [ -d "client/src/pages" ]; then
    page_count=$(find client/src/pages -name "*.tsx" -o -name "*.jsx" | wc -l)
    echo "✅ $page_count page components found"
else
    echo "❌ No pages directory"
fi

# Check dependencies
echo -e "\n📦 Dependencies:"
if [ -f "client/package.json" ]; then
    deps_count=$(grep -c '"dependencies"' client/package.json)
    scripts_count=$(grep -c '"scripts"' client/package.json)
    echo "✅ $deps_count dependencies, $scripts_count scripts"
else
    echo "❌ Cannot check dependencies"
fi

echo -e "\n🎯 Quick Assessment Complete!"

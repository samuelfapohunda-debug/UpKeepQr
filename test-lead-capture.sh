#!/bin/bash

echo "🧪 Testing Lead Capture Integration"
echo "===================================="
echo ""

# Test 1: Check files exist
echo "1. Checking files..."
FILES=(
  "shared/lead-schema.ts"
  "client/src/components/LeadCapture/LeadCaptureForm.tsx"
  "client/src/pages/OnboardingWithLead.tsx"
  "server/src/routes/leads.ts"
  "server/migrations/20251031024756_add_leads_table.sql"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file NOT FOUND"
  fi
done

echo ""
echo "2. Checking route registration..."
if grep -q "api/leads" server/src/routes/index.ts; then
  echo "  ✅ Leads route registered"
else
  echo "  ❌ Leads route NOT registered"
fi

echo ""
echo "3. Checking imports..."
if grep -q "OnboardingWithLead" client/src/App.tsx; then
  echo "  ✅ OnboardingWithLead imported in App.tsx"
else
  echo "  ❌ OnboardingWithLead NOT imported in App.tsx"
fi

echo ""
echo "4. Checking dependencies..."
if npm list zod &>/dev/null; then
  echo "  ✅ zod installed"
else
  echo "  ❌ zod NOT installed"
fi

if npm list express-rate-limit &>/dev/null; then
  echo "  ✅ express-rate-limit installed"
else
  echo "  ❌ express-rate-limit NOT installed"
fi

echo ""
echo "5. Build status..."
if [ -f "dist/public/assets/index-D1mpOJom.js" ]; then
  echo "  ✅ Build artifacts exist"
else
  echo "  ⚠️  Build artifacts not found (may need to rebuild)"
fi

echo ""
echo "================================"
echo "✅ Pre-flight checks complete!"
echo ""
echo "Next steps:"
echo "1. Set DATABASE_URL if not already set"
echo "2. Run migration: psql \$DATABASE_URL -f server/migrations/20251031024756_add_leads_table.sql"
echo "3. Start dev server: npm run dev"
echo "4. Test at: http://localhost:5000/setup/test-token"

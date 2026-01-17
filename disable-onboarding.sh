#!/bin/bash

echo "Disabling Onboarding component..."

# Backup
cp client/src/App.tsx client/src/App.tsx.backup2

# Comment out Onboarding import
sed -i 's|^import Onboarding from|// import Onboarding from|g' client/src/App.tsx

# Comment out Onboarding route
sed -i 's|<Route path="/setup/new">|{/* <Route path="/setup/new">|g' client/src/App.tsx
sed -i 's|<Onboarding adminMode={true} />|<Onboarding adminMode={true} /> */}|g' client/src/App.tsx

echo "✅ Onboarding disabled"
echo ""
echo "Verify:"
grep "Onboarding" client/src/App.tsx


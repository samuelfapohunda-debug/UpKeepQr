#!/bin/bash

echo "Fixing route comment..."

# Use a multi-line approach
cat > /tmp/route_fix.txt << 'ROUTE'
        {/* DISABLED: Old form - using SetupForm instead
        <Route path="/setup/new">
          <ProtectedRoute>
            <Onboarding adminMode={true} />
          </ProtectedRoute>
        </Route>
        */}
ROUTE

# Find and replace the route section
# This is safer - let's just manually fix it

# Show current state
echo "Current problematic section:"
grep -A 4 "setup/new" client/src/App.tsx


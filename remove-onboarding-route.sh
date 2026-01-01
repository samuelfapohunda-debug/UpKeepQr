#!/bin/bash

echo "Removing Onboarding route from App.tsx..."

# Backup first
cp client/src/App.tsx client/src/App.tsx.backup3

# Remove the entire route block (5 lines)
# This removes from "<Route path="/setup/new">" to its closing "</Route>"
sed -i '/<Route path="\/setup\/new">/,/<\/Route>/{//!d; d}' client/src/App.tsx

# Also remove the ProtectedRoute wrapper if it's orphaned
# Actually, let's be more precise - remove these exact 5 lines:
# We'll use a different approach

# Restore and try Python for multi-line deletion
cp client/src/App.tsx.backup3 client/src/App.tsx

python3 << 'PYTHON'
with open('client/src/App.tsx', 'r') as f:
    lines = f.readlines()

output = []
skip_until = None
for i, line in enumerate(lines):
    if '<Route path="/setup/new">' in line:
        # Found the start, skip until we find the closing </Route>
        skip_until = '</Route>'
        continue
    if skip_until and skip_until in line:
        # Found the end, stop skipping
        skip_until = None
        continue
    if not skip_until:
        output.append(line)

with open('client/src/App.tsx', 'w') as f:
    f.writelines(output)

print("✅ Removed Onboarding route")
PYTHON

echo ""
echo "Verifying removal:"
grep -n "setup/new" client/src/App.tsx || echo "✅ Route successfully removed"

echo ""
echo "Checking Onboarding references:"
grep -n "Onboarding" client/src/App.tsx


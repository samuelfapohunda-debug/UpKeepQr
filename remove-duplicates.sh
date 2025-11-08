#!/bin/bash

echo "🔧 Removing duplicate functions using sed..."

# Create backup
cp server/storage.ts server/storage.ts.backup2

# Remove the duplicate section starting from the comment line
sed -i '/\/\/ Also ensure these functions exist for home_profile_extra:/,$d' server/storage.ts

# Now add just the getHomeIdByToken function back (since it's not a duplicate)
cat >> server/storage.ts << 'FUNCTIONS'

// Home Profile Extra Functions - Public API compatible
export async function getHomeIdByToken(token: string): Promise<number | null> {
  try {
    const result = await db.query(
      `SELECT id FROM homes WHERE setup_token = $1`,
      [token]
    );
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Error getting homeId by token:', error);
    return null;
  }
}
FUNCTIONS

echo "✅ Removed duplicates and kept only getHomeIdByToken"

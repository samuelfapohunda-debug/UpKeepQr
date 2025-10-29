const fs = require('fs');

// Read the current storage.ts
let storageContent = fs.readFileSync('server/storage.ts', 'utf8');

// Check if we need to fix the function signatures
if (storageContent.includes('getHomeProfileExtra(householdId)')) {
  console.log('🔧 Fixing storage function compatibility...');
  
  // Replace householdId with homeId in the function signatures
  storageContent = storageContent.replace(
    /export async function getHomeProfileExtra\(householdId: string\)/g,
    'export async function getHomeProfileExtra(homeId: number)'
  );
  
  storageContent = storageContent.replace(
    /export async function updateHomeProfileExtra\(householdId: string, data: any\)/g,
    'export async function updateHomeProfileExtra(homeId: number, data: any)'
  );
  
  // Update the function implementations to use home_id instead of householdId
  storageContent = storageContent.replace(
    /\.where\(eq\(homeProfileExtras\.householdId, householdId\)\)/g,
    '.where(eq(homeProfileExtras.home_id, homeId))'
  );
  
  storageContent = storageContent.replace(
    /const existing = await getHomeProfileExtra\(householdId\);/g,
    'const existing = await getHomeProfileExtra(homeId);'
  );
  
  // Save the fixed storage.ts
  fs.writeFileSync('server/storage.ts', storageContent);
  console.log('✅ Storage functions updated to use homeId instead of householdId');
} else {
  console.log('✅ Storage functions already use correct homeId parameter');
}

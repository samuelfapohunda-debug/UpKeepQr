import fs from 'fs';

console.log('🔧 Quick fix: Remove everything after first getHomeIdByToken...');

let content = fs.readFileSync('server/storage.ts', 'utf8');

// Find the line that starts the duplicate section
const duplicateStart = content.indexOf('// Also ensure these functions exist for home_profile_extra:');
if (duplicateStart !== -1) {
  // Remove everything from that comment to the end
  content = content.substring(0, duplicateStart);
  console.log('✅ Removed everything after duplicate comment');
} else {
  // If no comment, find the second getHomeIdByToken and remove from there
  const firstGetHomeId = content.indexOf('export async function getHomeIdByToken');
  if (firstGetHomeId !== -1) {
    const secondGetHomeId = content.indexOf('export async function getHomeIdByToken', firstGetHomeId + 1);
    if (secondGetHomeId !== -1) {
      content = content.substring(0, secondGetHomeId);
      console.log('✅ Removed second getHomeIdByToken and everything after');
    }
  }
}

fs.writeFileSync('server/storage.ts', content);
console.log('✅ Quick fix applied');

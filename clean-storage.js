const fs = require('fs');

console.log('🧹 Cleaning duplicate functions from storage.ts...');

let content = fs.readFileSync('server/storage.ts', 'utf8');

// Find the first occurrence of each function and remove subsequent ones
const lines = content.split('\n');
let cleanedLines = [];
let inGetHomeProfileExtra = false;
let inUpdateHomeProfileExtra = false;
let getHomeProfileExtraFound = false;
let updateHomeProfileExtraFound = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if we're entering getHomeProfileExtra function
  if (line.includes('export async function getHomeProfileExtra') && !getHomeProfileExtraFound) {
    inGetHomeProfileExtra = true;
    getHomeProfileExtraFound = true;
    cleanedLines.push(line);
  } 
  // Check if we're entering updateHomeProfileExtra function
  else if (line.includes('export async function updateHomeProfileExtra') && !updateHomeProfileExtraFound) {
    inUpdateHomeProfileExtra = true;
    updateHomeProfileExtraFound = true;
    cleanedLines.push(line);
  }
  // Check if we're exiting either function
  else if (inGetHomeProfileExtra && line.trim() === '}') {
    inGetHomeProfileExtra = false;
    cleanedLines.push(line);
  }
  else if (inUpdateHomeProfileExtra && line.trim() === '}') {
    inUpdateHomeProfileExtra = false;
    cleanedLines.push(line);
  }
  // Skip duplicate function definitions
  else if (line.includes('export async function getHomeProfileExtra') && getHomeProfileExtraFound) {
    console.log('❌ Skipping duplicate getHomeProfileExtra at line', i + 1);
    // Skip this entire function
    let braceCount = 0;
    let j = i;
    while (j < lines.length) {
      if (lines[j].includes('{')) braceCount++;
      if (lines[j].includes('}')) braceCount--;
      j++;
      if (braceCount === 0) break;
    }
    i = j - 1; // Skip to after the function
    continue;
  }
  else if (line.includes('export async function updateHomeProfileExtra') && updateHomeProfileExtraFound) {
    console.log('❌ Skipping duplicate updateHomeProfileExtra at line', i + 1);
    // Skip this entire function
    let braceCount = 0;
    let j = i;
    while (j < lines.length) {
      if (lines[j].includes('{')) braceCount++;
      if (lines[j].includes('}')) braceCount--;
      j++;
      if (braceCount === 0) break;
    }
    i = j - 1; // Skip to after the function
    continue;
  }
  // Keep all other lines
  else {
    cleanedLines.push(line);
  }
}

// Write cleaned content
fs.writeFileSync('server/storage.ts', cleanedLines.join('\n'));
console.log('✅ Removed duplicate functions');
console.log('✅ Cleaned storage.ts saved');

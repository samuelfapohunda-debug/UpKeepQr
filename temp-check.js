const fs = require('fs');
const content = fs.readFileSync('./server/index.ts', 'utf8');
const lines = content.split('\n');
console.log('Lines 40-50:');
lines.slice(39, 50).forEach((line, i) => {
  console.log(`${i + 40}: ${line}`);
});

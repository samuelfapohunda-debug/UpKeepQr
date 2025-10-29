import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing express-rate-limit import...');

const rateLimitPath = 'server/src/middleware/rateLimit.ts';

if (fs.existsSync(rateLimitPath)) {
  let content = fs.readFileSync(rateLimitPath, 'utf8');
  
  // Try different import styles
  if (content.includes("import rateLimit from 'express-rate-limit';")) {
    console.log('✅ Import statement looks correct');
  } else {
    // Replace with CommonJS style import if needed
    content = content.replace(
      /import rateLimit from ['"]express-rate-limit['"];/,
      "import rateLimit from 'express-rate-limit';"
    );
    fs.writeFileSync(rateLimitPath, content);
    console.log('✅ Updated import statement');
  }
  
  console.log('Current import:', content.match(/import.*express-rate-limit.*/)?.[0] || 'Not found');
} else {
  console.log('❌ rateLimit.ts not found');
}

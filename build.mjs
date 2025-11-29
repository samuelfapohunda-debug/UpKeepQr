/* eslint-disable no-undef */
/* eslint-disable no-console */
import { exec } from 'child_process';
import { promisify } from 'util';
import { copyFile, mkdir, cp } from 'fs/promises';

const execAsync = promisify(exec);

async function build() {
  try {
    // Create dist directory
    await mkdir('./dist/server', { recursive: true });
    
    console.log('🔨 Compiling TypeScript with tsc...');
    
    // Compile TypeScript
    await execAsync('npx tsc --project tsconfig.server.json');
    
    console.log('✅ TypeScript compilation complete');
    
    // Copy preload-stripe.cjs to dist
    await copyFile('./server/preload-stripe.cjs', './dist/server/preload-stripe.cjs');
    console.log('✅ Copied preload-stripe.cjs to dist');
    
    console.log('✅ Server build complete');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

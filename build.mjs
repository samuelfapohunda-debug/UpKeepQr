/* eslint-disable no-undef */
/* eslint-disable no-console */
import * as esbuild from 'esbuild';
import { copyFile, mkdir, cp, readFile, writeFile } from 'fs/promises';

async function build() {
  try {
    // Create dist directories
    await mkdir('./dist/server', { recursive: true });
    await mkdir('./dist/server/public', { recursive: true });
    
    // Copy preload-stripe.cjs to dist
    await copyFile('./server/preload-stripe.cjs', './dist/server/preload-stripe.cjs');
    console.log('✅ Copied preload-stripe.cjs to dist');
    
    // Copy lib folder to dist
    await cp('./server/lib', './dist/server/lib', { recursive: true });
    console.log('✅ Copied lib folder to dist');
    
    // Copy src folder to dist  
    await cp('./server/src', './dist/server/src', { recursive: true });
    console.log('✅ Copied src folder to dist');
    
    // Build server with esbuild
    await esbuild.build({
      entryPoints: ['./server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: './dist/server/index.js',
      external: [
        'node:*',
        'vite',
        'esbuild',
        '@vitejs/plugin-react',
        'lightningcss',
        '@neondatabase/serverless',
        'drizzle-orm',
        'express',
        'cors',
        'morgan',
        'ws',
        'pg',
        'stripe',
        'bcryptjs',
        'jsonwebtoken',
        'qrcode',
        'ics',
        'csv-writer',
        'node-cron',
        'resend',
        'firebase-admin',
        'firebase',
        'dotenv',
        'nanoid'
      ],
      sourcemap: true,
      minify: false,
      logLevel: 'info',
      packages: 'external'
    });
    
    // Inject today's date into sw.js so the cache name changes on every deploy
    const today = new Date().toISOString().split('T')[0];
    const swPath = './client/public/sw.js';
    const swContent = await readFile(swPath, 'utf8');
    const updatedSw = swContent.replace(
      /const BUILD_VERSION = self\.__BUILD_VERSION__ \|\| '[^']+';/,
      `const BUILD_VERSION = self.__BUILD_VERSION__ || '${today}';`
    );
    await writeFile(swPath, updatedSw, 'utf8');
    console.log(`✅ Service Worker version set to ${today}`);

    console.log('✅ Server build complete');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

/* eslint-disable no-undef */
/* eslint-disable no-console */
import * as esbuild from 'esbuild';
import { copyFile, mkdir, cp } from 'fs/promises';

async function build() {
  try {
    // Create dist directory
    await mkdir('./dist/server', { recursive: true });
    
    // Copy preload-stripe.cjs to dist
    await copyFile('./server/preload-stripe.cjs', './dist/server/preload-stripe.cjs');
    console.log('✅ Copied preload-stripe.cjs to dist');
    
    // Copy lib folder to dist
    await cp('./server/lib', './dist/server/lib', { recursive: true });
    console.log('✅ Copied lib folder to dist');
    
    // Build server with esbuild
    await esbuild.build({
      entryPoints: ['./server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: './dist/server/index.js',
      external: [
        // Node built-ins
        'node:*',
        // Build/Dev tools that shouldn't be bundled
        'vite',
        'esbuild',
        '@vitejs/plugin-react',
        'lightningcss',
        // Dependencies that should not be bundled
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
        '@sendgrid/mail',
        'firebase-admin',
        'firebase',
        'dotenv',
        'nanoid'
      ],
      sourcemap: true,
      minify: false,
      logLevel: 'info'
    });
    
    console.log('✅ Server build complete');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

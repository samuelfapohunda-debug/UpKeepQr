import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a placeholder database object to prevent crashes
function createPlaceholderDb() {
  return {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false }),
        set: () => Promise.resolve(),
        update: () => Promise.resolve()
      }),
      where: () => ({
        limit: () => ({
          get: () => Promise.resolve({ empty: true, docs: [] })
        }),
        orderBy: () => ({
          get: () => Promise.resolve({ empty: true, docs: [] })
        }),
        get: () => Promise.resolve({ empty: true, docs: [] })
      }),
      orderBy: () => ({
        get: () => Promise.resolve({ empty: true, docs: [] })
      }),
      get: () => Promise.resolve({ empty: true, docs: [] })
    })
  };
}

// Firebase configuration (client-side)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "georgia-top-roofer.firebaseapp.com",
  databaseURL: "https://georgia-top-roofer-default-rtdb.firebaseio.com",
  projectId: "georgia-top-roofer",
  storageBucket: "georgia-top-roofer.firebasestorage.app",
  messagingSenderId: "948307135034",
  appId: "1:948307135034:web:7a7f85b811367f43ebc303"
};

// Initialize Firebase client app
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

// Initialize Firebase Admin SDK for server operations
if (admin.apps.length === 0) {
  const projectId = "georgia-top-roofer";
  
  if (!projectId) {
    console.warn('Firebase configuration is missing. Firebase features will be disabled.');
    (global as any).adminDb = createPlaceholderDb();
  } else {
    let serviceAccount;
    
    try {
      // Try to load from JSON file first
      const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
      try {
        const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountFile);
        console.log('✅ Loaded Firebase service account from file');
      } catch (fileError) {
        console.log('📄 Service account file not found, trying environment variables...');
        
        // Fallback: Try to parse from environment variable
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
          if (rawKey.startsWith('{') && rawKey.endsWith('}')) {
            serviceAccount = JSON.parse(rawKey);
            console.log('✅ Loaded Firebase service account from environment variable');
          }
        }
        
        // Fallback: Try individual environment variables
        if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
          serviceAccount = {
            type: "service_account",
            project_id: projectId,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || '')}`
          };
          console.log('✅ Loaded Firebase service account from individual environment variables');
        }
      }
    } catch (error) {
      console.error('Error loading Firebase service account:', error instanceof Error ? error.message : error);
      serviceAccount = null;
    }

    // Only initialize if we have the required credentials
    if (serviceAccount && serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          projectId: projectId,
          databaseURL: "https://georgia-top-roofer-default-rtdb.firebaseio.com"
        });
        console.log('✅ Firebase Admin SDK initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error instanceof Error ? error.message : error);
        (global as any).adminDb = createPlaceholderDb();
      }
    } else {
      console.warn('⚠️ Firebase service account credentials are incomplete. Firebase features will be disabled.');
      (global as any).adminDb = createPlaceholderDb();
    }
  }
}

// Export adminDb - use placeholder if Firebase is not initialized properly
export const adminDb = admin.apps.length > 0 ? admin.firestore() : (global as any).adminDb;
export const adminRealtimeDb = admin.apps.length > 0 ? admin.database() : null;
export { admin };
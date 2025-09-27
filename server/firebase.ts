import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import admin from 'firebase-admin';

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
  // Check if we have Firebase credentials before trying to initialize
  const projectId = "georgia-top-roofer";
  
  if (!projectId) {
    console.warn('Firebase configuration is missing. Firebase features will be disabled.');
    // Create a placeholder adminDb to prevent crashes
    (global as any).adminDb = createPlaceholderDb();
  } else {
    let serviceAccount;
    
    try {
      // Try to parse the service account key if it exists
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        // Check if it looks like JSON (starts with { and ends with })
        if (rawKey.startsWith('{') && rawKey.endsWith('}')) {
          serviceAccount = JSON.parse(rawKey);
        } else {
          console.warn('Firebase service account key does not appear to be valid JSON format');
          serviceAccount = null;
        }
      }
    } catch (error) {
      console.error('Error parsing Firebase service account key:', error.message);
      serviceAccount = null;
    }
    
    // Fallback to individual environment variables if JSON parsing failed
    if (!serviceAccount) {
      serviceAccount = {
        project_id: projectId,  // Use project_id instead of projectId
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || '')}`
      };
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
        console.error('Failed to initialize Firebase Admin SDK:', error.message);
        // Create placeholder adminDb if initialization fails
        (global as any).adminDb = createPlaceholderDb();
      }
    } else {
      console.warn('Firebase service account credentials are incomplete. Firebase features will be disabled.');
      // Create placeholder adminDb
      (global as any).adminDb = createPlaceholderDb();
    }
  }
}

// Export adminDb - use placeholder if Firebase is not initialized properly
export const adminDb = admin.apps.length > 0 ? admin.firestore() : (global as any).adminDb;
export const adminRealtimeDb = admin.apps.length > 0 ? admin.database() : null;
export { admin };
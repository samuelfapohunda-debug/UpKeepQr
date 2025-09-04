import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import admin from 'firebase-admin';

// Firebase configuration (client-side)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase client app
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Firebase Admin SDK for server operations
if (admin.apps.length === 0) {
  // Check if we have Firebase credentials before trying to initialize
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    console.warn('Firebase configuration is missing. Firebase features will be disabled.');
    // Create a placeholder adminDb to prevent crashes
    (global as any).adminDb = {
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
  } else {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : {
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

    // Only initialize if we have the required credentials
    if (serviceAccount.project_id && (serviceAccount.private_key || process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: projectId
      });
    } else {
      console.warn('Firebase service account credentials are incomplete. Firebase features will be disabled.');
      // Create placeholder adminDb
      (global as any).adminDb = {
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
  }
}

// Export adminDb - use placeholder if Firebase is not initialized properly
export const adminDb = admin.apps.length > 0 ? admin.firestore() : (global as any).adminDb;
export { admin };
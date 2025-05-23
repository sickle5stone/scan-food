import { enableIndexedDbPersistence } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore first
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Enable offline persistence with better error handling
const initializePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true,
      forceOwnership: false
    });
    console.log('Firestore persistence enabled successfully');
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      const errorCode = (err as { code: string }).code;
      switch (errorCode) {
        case 'failed-precondition':
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          break;
        case 'unimplemented':
          console.warn('The current browser does not support persistence.');
          break;
        case 'unavailable':
          console.warn('IndexedDB is not available. Offline persistence will not work.');
          break;
        case 'already-exists':
          console.warn('Persistence has already been enabled.');
          break;
        default:
          console.error('Error enabling persistence:', err);
      }
    } else {
      console.error('Unknown error enabling persistence:', err);
    }
  }
};

// Initialize persistence after a short delay to ensure proper initialization order
setTimeout(() => {
  initializePersistence();
}, 100);

export default app; 
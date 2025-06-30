import * as admin from 'firebase-admin';

// Use a static require with a relative path to be bundler-friendly.
// This path goes from `src/lib` up one level to `src` and then up another to the root.
const serviceAccount = require('../../firebase-service-account.json');

console.log("--- Initializing Firebase Admin SDK ---");

// Log the environment variables to check if they are loaded correctly
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? 'Loaded' : 'Missing');
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? 'Loaded' : 'Missing');
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? 'Loaded' : 'Missing');
console.log("STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Loaded' : 'Missing');

// Check if the required environment variables are set
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  throw new Error('Firebase Admin SDK environment variables are not set.');
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin SDK initialized successfully from file.");
  } catch (error) {
    console.error("CRITICAL: Error initializing Firebase Admin SDK from file:", error);
    throw error;
  }
}

const adminAuth = admin.auth();
const adminFirestore = admin.firestore();
const adminStorage = admin.storage();

console.log("--- Firebase Admin SDK setup complete ---");

export { adminAuth, adminFirestore, adminStorage }; 
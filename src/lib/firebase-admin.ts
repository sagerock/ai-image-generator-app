import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

console.log("--- Initializing Firebase Admin SDK ---");

// Check if the required environment variables are set
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
) {
  console.error("Missing required Firebase environment variables");
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing");
  console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ Set" : "❌ Missing");
  console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "✅ Set" : "❌ Missing");
  console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✅ Set" : "❌ Missing");
  throw new Error('Firebase Admin SDK environment variables are not set. Please check your .env.local file.');
}

// Initialize Firebase Admin SDK only if it hasn't been initialized already
let app;
if (!getApps().length) {
  try {
    // Parse the private key properly (it might have escaped newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');
    
    console.log("🔧 Initializing Firebase Admin App...");
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    });
    
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error);
    throw error;
  }
} else {
  app = getApps()[0];
  console.log("✅ Using existing Firebase Admin app");
}

const adminAuth = getAdminAuth(app);
const adminFirestore = getAdminFirestore(app);
const adminStorage = getAdminStorage(app);

console.log("--- Firebase Admin SDK setup complete ---");

export { adminAuth, adminFirestore, adminStorage }; 
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';
import { getModelCredits } from '@/lib/models';

// Lazy initialization - only initialize when actually needed at runtime
let _app: App | null = null;
let _adminAuth: Auth | null = null;
let _adminFirestore: Firestore | null = null;
let _adminStorage: Storage | null = null;

function getApp(): App {
  if (_app) return _app;

  // Check if already initialized
  if (getApps().length) {
    _app = getApps()[0];
    return _app;
  }

  // Check required environment variables
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
    throw new Error('Firebase Admin SDK environment variables are not set.');
  }

  // Parse the private key properly (it might have escaped newlines)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

  console.log("🔧 Initializing Firebase Admin App...");
  _app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  });

  console.log("✅ Firebase Admin SDK initialized successfully");
  return _app;
}

// Lazy getters for Firebase services
export const adminAuth = {
  get instance(): Auth {
    if (!_adminAuth) {
      _adminAuth = getAdminAuth(getApp());
    }
    return _adminAuth;
  },
  verifyIdToken(token: string) {
    return this.instance.verifyIdToken(token);
  }
};

export const adminFirestore = {
  get instance(): Firestore {
    if (!_adminFirestore) {
      _adminFirestore = getAdminFirestore(getApp());
    }
    return _adminFirestore;
  },
  collection(path: string) {
    return this.instance.collection(path);
  }
};

export const adminStorage = {
  get instance(): Storage {
    if (!_adminStorage) {
      _adminStorage = getAdminStorage(getApp());
    }
    return _adminStorage;
  },
  bucket() {
    return this.instance.bucket();
  }
};

// Admin helper functions
export async function getAllUsers() {
  try {
    const usersRef = adminFirestore.collection('users');
    const snapshot = await usersRef.get();

    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || 'unknown@email.com',
        credits: data.credits || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      };
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function getUserStats(userId: string) {
  try {
    // Get user info
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Get images and calculate actual credits used
    const imagesRef = adminFirestore.collection('generated-images');
    const imagesSnapshot = await imagesRef.where('userId', '==', userId).get();
    const imageCount = imagesSnapshot.size;

    // Calculate actual credits used based on models used
    let creditsUsed = 0;
    imagesSnapshot.forEach(doc => {
      const imageData = doc.data();
      const model = imageData.model || 'flux-schnell';
      creditsUsed += getModelCredits(model);
    });

    return {
      userData,
      imageCount,
      creditsUsed,
      credits: userData?.credits || 0
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}

export async function updateUserCredits(userId: string, newCredits: number) {
  try {
    await adminFirestore.collection('users').doc(userId).update({
      credits: newCredits,
      updatedAt: FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}

export async function createUserProfile(userId: string, email: string) {
  try {
    const userRef = adminFirestore.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        email,
        credits: 50, // Free credits for new users
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`✅ Created user profile for ${email} with 50 free credits`);
    }

    return userDoc.exists ? userDoc.data() : await userRef.get().then(doc => doc.data());
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export { FieldValue };

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
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
    
    // Get image count
    const imagesRef = adminFirestore.collection('generated-images');
    const imagesSnapshot = await imagesRef.where('userId', '==', userId).get();
    const imageCount = imagesSnapshot.size;
    
    return {
      userData,
      imageCount,
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
        credits: 10, // Free credits for new users
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`✅ Created user profile for ${email} with 10 free credits`);
    }
    
    return userDoc.exists ? userDoc.data() : await userRef.get().then(doc => doc.data());
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export { adminAuth, adminFirestore, adminStorage }; 
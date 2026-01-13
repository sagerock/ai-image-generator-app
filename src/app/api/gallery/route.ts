import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the user's authentication
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Fetch user's images from Firestore
    console.log('📥 Fetching images for user:', userId);
    const imagesRef = adminFirestore.collection('generated-images');
    const snapshot = await imagesRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')  // Order by newest first in Firestore
      .limit(50) // Limit to 50 most recent images
      .get();

    const images = snapshot.docs.map(doc => {
      const data = doc.data();
      // Handle missing or invalid createdAt
      let createdAt: string;
      try {
        createdAt = data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
      } catch {
        createdAt = new Date().toISOString();
      }
      return {
        id: doc.id,
        prompt: data.prompt || 'No prompt',
        model: data.model || 'unknown',
        imageUrl: data.imageUrl,
        createdAt,
        size: data.size,
        quality: data.quality
      };
    });

    console.log(`✅ Found ${images.length} images for user`);

    return NextResponse.json({ 
      images,
      total: images.length
    });

  } catch (error) {
    console.error('❌ Error fetching gallery images:', error);

    // Check for Firestore index error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('index')) {
      console.error('⚠️ Firestore index may need to be created. Check Firebase Console.');
      return NextResponse.json(
        { error: 'Gallery is being set up. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch images. Please try again.' },
      { status: 500 }
    );
  }
} 
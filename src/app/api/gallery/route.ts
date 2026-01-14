import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore, adminStorage } from '@/lib/firebase-admin';

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
        quality: data.quality,
        tags: data.tags || [],
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

export async function DELETE(request: NextRequest) {
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

    // Get the image ID from the request body
    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Get the image document
    const imageRef = adminFirestore.collection('generated-images').doc(imageId);
    const imageDoc = await imageRef.get();

    if (!imageDoc.exists) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageData = imageDoc.data();

    // Verify ownership
    if (imageData?.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this image' }, { status: 403 });
    }

    // Delete from Firebase Storage if fileName exists
    if (imageData?.fileName) {
      try {
        const bucket = adminStorage.bucket();
        const file = bucket.file(imageData.fileName);
        await file.delete();
        console.log(`🗑️ Deleted file from storage: ${imageData.fileName}`);
      } catch (storageError) {
        // Log but don't fail if storage deletion fails (file might already be gone)
        console.error('Error deleting from storage:', storageError);
      }
    }

    // Delete from Firestore
    await imageRef.delete();
    console.log(`🗑️ Deleted image document: ${imageId}`);

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image. Please try again.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Get the image ID and tags from the request body
    const body = await request.json();
    const { imageId, tags } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 });
    }

    // Validate and clean tags
    const cleanedTags = tags
      .map(tag => String(tag).trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .slice(0, 20); // Limit to 20 tags max

    // Get the image document
    const imageRef = adminFirestore.collection('generated-images').doc(imageId);
    const imageDoc = await imageRef.get();

    if (!imageDoc.exists) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageData = imageDoc.data();

    // Verify ownership
    if (imageData?.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to update this image' }, { status: 403 });
    }

    // Update the tags
    await imageRef.update({ tags: cleanedTags });
    console.log(`🏷️ Updated tags for image ${imageId}:`, cleanedTags);

    return NextResponse.json({
      success: true,
      message: 'Tags updated successfully',
      tags: cleanedTags
    });

  } catch (error) {
    console.error('❌ Error updating tags:', error);
    return NextResponse.json(
      { error: 'Failed to update tags. Please try again.' },
      { status: 500 }
    );
  }
} 
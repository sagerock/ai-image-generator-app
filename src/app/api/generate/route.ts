import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore, adminStorage, createUserProfile, FieldValue } from '@/lib/firebase-admin';
import { getModel } from '@/lib/models';
import { getProvider } from '@/lib/providers';
import { AspectRatio } from '@/lib/models/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model: modelId, idToken, aspectRatio } = body;

    console.log('API Request:', { prompt, model: modelId, aspectRatio });

    // Verify the user's authentication
    if (!idToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    if (!prompt || !modelId) {
      return NextResponse.json({ error: 'Prompt and model are required' }, { status: 400 });
    }

    // Get model configuration from registry
    const model = getModel(modelId);
    if (!model) {
      return NextResponse.json({ error: 'Unknown model' }, { status: 400 });
    }
    if (!model.isActive) {
      return NextResponse.json({ error: 'This model has been deprecated' }, { status: 400 });
    }

    // Check user credits
    console.log('💳 Checking user credits...');
    const userRef = adminFirestore.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create user profile if it doesn't exist
      console.log('👤 Creating user profile...');
      await createUserProfile(userId, decodedToken.email || 'unknown@email.com');
      const newUserDoc = await userRef.get();
      const userData = newUserDoc.data();
      console.log(`✅ User profile created with ${userData?.credits || 0} credits`);
    }

    const userData = userDoc.exists ? userDoc.data() : (await userRef.get()).data();
    const currentCredits = userData?.credits || 0;

    if (currentCredits < model.credits) {
      return NextResponse.json({
        error: 'Insufficient credits',
        message: `You need ${model.credits} credits to generate an image with ${model.name}. You currently have ${currentCredits} credits. Email sage@sagerock.com to get more credits.`,
        credits: currentCredits
      }, { status: 402 });
    }

    console.log(`💳 User has ${currentCredits} credits, proceeding with ${model.name} (${model.credits} credits)...`);

    // Generate image using the appropriate provider
    console.log(`🎨 Generating image with ${model.name}...`);
    const provider = getProvider(model.provider);
    const result = await provider.generate({
      prompt,
      model,
      aspectRatio: aspectRatio as AspectRatio,
    });

    const imageUrl = result.imageUrl;
    let imageBuffer: Buffer;

    // Handle base64 data URLs (from Google provider)
    if (imageUrl.startsWith('data:')) {
      console.log('📥 Processing base64 image data...');
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Download the image from the URL
      console.log('📥 Downloading image from URL...');
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } catch (e) {
        console.error("Error downloading image:", e);
        throw new Error("Failed to download image from provider.");
      }
    }

    // Upload to Firebase Storage
    console.log('☁️ Uploading to Firebase Storage...');
    const fileName = `${Date.now()}.webp`;
    const file = adminStorage.bucket().file(`images/${userId}/${fileName}`);

    await file.save(imageBuffer, {
      metadata: { contentType: 'image/webp' },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${file.name}`;

    console.log('✅ Image uploaded to Firebase Storage');

    // Save metadata to Firestore
    console.log('💾 Saving metadata to Firestore...');
    const imageDoc = {
      userId: userId,
      prompt: prompt,
      model: modelId,
      imageUrl: publicUrl,
      fileName: fileName,
      createdAt: FieldValue.serverTimestamp(),
      aspectRatio: aspectRatio,
      tags: [],
    };

    const docRef = await adminFirestore.collection('generated-images').add(imageDoc);
    console.log('✅ Metadata saved to Firestore with ID:', docRef.id);

    // Consume credits based on model
    console.log(`💳 Consuming ${model.credits} credit${model.credits > 1 ? 's' : ''}...`);
    const newCredits = currentCredits - model.credits;
    await userRef.update({
      credits: newCredits,
      updatedAt: new Date()
    });
    console.log(`✅ Credits consumed. User now has ${newCredits} credits remaining`);

    return NextResponse.json({
      imageUrl: publicUrl,
      imageId: docRef.id,
      credits: newCredits,
      message: 'Image generated and saved successfully'
    });

  } catch (error) {
    console.error('❌ Error in generate API:', error);
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}

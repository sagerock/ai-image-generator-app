import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminAuth, adminFirestore, adminStorage } from '@/lib/firebase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, idToken } = body;

    console.log('API Request:', { prompt, model });

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

    if (!prompt || !model) {
      return NextResponse.json({ error: 'Prompt and model are required' }, { status: 400 });
    }

    // For now, only DALL-E 3 is implemented
    if (model !== 'dall-e-3') {
      return NextResponse.json({ error: 'Only DALL-E 3 is currently supported' }, { status: 400 });
    }

    // Generate image with OpenAI
    console.log('🎨 Generating image with DALL-E 3...');
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('✅ Image generated successfully');

    // Download the image from OpenAI
    console.log('📥 Downloading image from OpenAI...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from OpenAI');
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `generated-images/${userId}/${timestamp}.png`;
    
    // Upload to Firebase Storage
    console.log('☁️ Uploading to Firebase Storage...');
    const bucket = adminStorage.bucket();
    const file = bucket.file(filename);
    
    await file.save(Buffer.from(imageBuffer), {
      metadata: {
        contentType: 'image/png',
        metadata: {
          userId: userId,
          prompt: prompt,
          model: model,
          createdAt: new Date().toISOString(),
        }
      }
    });

    // Make the file publicly accessible
    await file.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    
    console.log('✅ Image uploaded to Firebase Storage');

    // Save metadata to Firestore
    console.log('💾 Saving metadata to Firestore...');
    const imageDoc = {
      userId: userId,
      prompt: prompt,
      model: model,
      imageUrl: publicUrl,
      fileName: filename,
      createdAt: new Date(),
      size: "1024x1024",
      quality: "standard"
    };

    const docRef = await adminFirestore.collection('generated-images').add(imageDoc);
    console.log('✅ Metadata saved to Firestore with ID:', docRef.id);

    return NextResponse.json({ 
      imageUrl: publicUrl,
      imageId: docRef.id,
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
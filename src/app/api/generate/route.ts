import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';
import { adminAuth, adminFirestore, adminStorage, createUserProfile } from '@/lib/firebase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Model configurations
const getModelConfig = (modelId: string) => {
  const models: Record<string, { 
    name: string; 
    credits: number; 
    provider: 'openai' | 'replicate';
    replicateModel?: string;
    aspectRatio?: string;
  }> = {
    'flux-schnell': { 
      name: 'FLUX Schnell', 
      credits: 1, 
      provider: 'replicate',
      replicateModel: 'black-forest-labs/flux-schnell',
      aspectRatio: '1:1'
    },
    'stable-diffusion': { 
      name: 'Stable Diffusion', 
      credits: 1, 
      provider: 'replicate',
      replicateModel: 'stability-ai/stable-diffusion',
      aspectRatio: '1:1'
    },
    'flux-dev': { 
      name: 'FLUX Dev', 
      credits: 1, 
      provider: 'replicate',
      replicateModel: 'black-forest-labs/flux-dev',
      aspectRatio: '1:1'
    },
    'flux-pro': { 
      name: 'FLUX Pro', 
      credits: 2, 
      provider: 'replicate',
      replicateModel: 'black-forest-labs/flux-pro',
      aspectRatio: '1:1'
    },
    'dall-e-3': { 
      name: 'DALL-E 3', 
      credits: 3, 
      provider: 'openai'
    }
  };
  return models[modelId];
};

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

    // Get model configuration
    const modelConfig = getModelConfig(model);
    if (!modelConfig) {
      return NextResponse.json({ error: 'Unsupported model' }, { status: 400 });
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
    
    if (currentCredits < modelConfig.credits) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        message: `You need ${modelConfig.credits} credits to generate an image with ${modelConfig.name}. You currently have ${currentCredits} credits.`,
        credits: currentCredits
      }, { status: 402 });
    }
    
    console.log(`💳 User has ${currentCredits} credits, proceeding with ${modelConfig.name} (${modelConfig.credits} credits)...`);

    // Generate image based on provider
    console.log(`🎨 Generating image with ${modelConfig.name}...`);
    let imageUrl: string;

    if (modelConfig.provider === 'openai') {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const responseUrl = response.data?.[0]?.url;
      if (!responseUrl) {
        throw new Error('No image URL returned from OpenAI');
      }
      imageUrl = responseUrl;
    } else if (modelConfig.provider === 'replicate') {
      const input: any = {
        prompt: prompt,
        aspect_ratio: modelConfig.aspectRatio || "1:1",
        output_format: "png",
        output_quality: 90,
      };

      // Add model-specific parameters
      if (model === 'flux-schnell') {
        input.num_inference_steps = 4; // Fast generation
      } else if (model === 'stable-diffusion') {
        input.width = 1024;
        input.height = 1024;
        input.num_inference_steps = 50;
      }

      const output = await replicate.run(modelConfig.replicateModel! as `${string}/${string}`, { input });
      
      if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0] as string;
      } else if (typeof output === 'string') {
        imageUrl = output;
      } else {
        throw new Error('No image URL returned from Replicate');
      }
    } else {
      throw new Error('Unsupported provider');
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

    // Consume credits based on model
    console.log(`💳 Consuming ${modelConfig.credits} credit${modelConfig.credits > 1 ? 's' : ''}...`);
    const newCredits = currentCredits - modelConfig.credits;
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
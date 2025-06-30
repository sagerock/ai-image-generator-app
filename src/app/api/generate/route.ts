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
      name: 'Stable Diffusion 2.1', 
      credits: 1, 
      provider: 'replicate',
      replicateModel: 'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
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
      name: 'FLUX 1.1 Pro',
      credits: 2,
      provider: 'replicate',
      replicateModel: 'black-forest-labs/flux-1.1-pro',
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
    let imageUrl: string | null = null;
    let imageBuffer: Buffer | null = null;

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
      // Check if Replicate API token is available
      if (!process.env.REPLICATE_API_TOKEN) {
        console.error('❌ REPLICATE_API_TOKEN environment variable not set');
        throw new Error('Replicate API token not configured');
      }

      console.log('🔑 Replicate API token available, proceeding...');
      
      // Start with minimal input parameters to debug
      const input: any = {
        prompt: prompt,
      };

      // Add only essential parameters for each model
      if (model === 'flux-schnell') {
        // FLUX Schnell - use the correct parameters for official Replicate model
        input.go_fast = true;
        input.num_outputs = 1;
        input.aspect_ratio = "1:1";
        input.output_format = "webp";
        input.output_quality = 90;
      } else if (model === 'flux-dev') {
        // FLUX Dev - minimal parameters  
        input.aspect_ratio = "1:1";
        input.num_outputs = 1;
        input.output_format = "webp";
        input.output_quality = 90;
      } else if (model === 'flux-pro') {
        // FLUX 1.1 Pro - minimal parameters
        input.aspect_ratio = "1:1";
        input.num_outputs = 1;
        input.output_format = "webp";
        input.output_quality = 90;
      } else if (model === 'stable-diffusion') {
        // Stable Diffusion - keep existing parameters as they were working before
        input.width = 512;
        input.height = 512;
        input.num_inference_steps = 50;
        input.guidance_scale = 7.5;
      }

      console.log('📤 Sending request to Replicate with input:', JSON.stringify(input, null, 2));
      
      try {
        const modelIdentifier = modelConfig.replicateModel!;
        const hasVersion = modelIdentifier.includes(':');
        
        console.log(`🚀 Creating Replicate prediction for model: ${modelIdentifier}`);

        const createOptions: any = { input };
        if (hasVersion) {
          createOptions.version = modelIdentifier;
        } else {
          createOptions.model = modelIdentifier;
        }

        const prediction = await replicate.predictions.create(createOptions);

        if (!prediction || !prediction.id) {
          throw new Error("Failed to create prediction with Replicate.");
        }

        console.log(`⏳ Prediction created with ID: ${prediction.id}. Waiting for completion...`);
        console.log(`View on Replicate: ${prediction.urls?.get}`);

        // Wait for the prediction to complete
        const completedPrediction = await replicate.wait(prediction, {});

        console.log('✅ Prediction completed with status:', completedPrediction.status);

        if (completedPrediction.status !== 'succeeded') {
            console.error('❌ Prediction failed or was canceled. Full details:', JSON.stringify(completedPrediction, null, 2));
            throw new Error(`Prediction ended with status: ${completedPrediction.status}. Error: ${completedPrediction.error}`);
        }

        console.log('RAW Replicate output:', JSON.stringify(completedPrediction.output, null, 2));
        const output = completedPrediction.output;
        
        if (typeof output === 'string' && output.startsWith('http')) {
          imageUrl = output;
        } else if (Array.isArray(output) && output.length > 0) {
          // The model might return an array of URLs, Buffers, or objects containing URLs
          for (const item of output) {
            if (typeof item === 'string' && item.startsWith('http')) {
              imageUrl = item as string;
              break;
            }
            if (Buffer.isBuffer(item)) {
              console.log('✅ Received image buffer inside array from Replicate.');
              imageBuffer = item as Buffer;
              break;
            }
            if (typeof item === 'object' && item !== null) {
              const maybeUrl = Object.values(item).find((v: any) => typeof v === 'string' && v.startsWith('http'));
              if (maybeUrl) {
                imageUrl = maybeUrl as string;
                break;
              }
            }
          }
        } else if (typeof output === 'object' && output !== null) {
          // Sometimes the API returns a single object with a URL field
          const maybeUrl = Object.values(output).find((v: any) => typeof v === 'string' && v.startsWith('http'));
          if (maybeUrl) {
            imageUrl = maybeUrl as string;
          } else if (Buffer.isBuffer(output)) {
            imageBuffer = output as Buffer;
          }
        } else if (Buffer.isBuffer(output)) {
          console.log('✅ Received single image buffer directly from Replicate.');
          imageBuffer = output;
        }
        
        if (!imageUrl && !imageBuffer) {
          console.error('❌ Unhandled Replicate output format:', JSON.stringify(output, null, 2));
          throw new Error(`No valid image data returned from Replicate. Received: ${JSON.stringify(output)}`);
        }
      } catch (replicateError: any) {
        console.error('❌ Replicate API Error:', replicateError);
        console.error('❌ Error details:', {
          message: replicateError.message,
          status: replicateError.status,
          details: replicateError.detail || replicateError.details,
        });
        throw new Error(`Replicate API failed: ${replicateError.message}`);
      }
    } else {
      throw new Error('Unsupported provider');
    }

    // If we have a URL, download the image into a buffer.
    // If we already have a buffer (from flux-1.1-pro), we can skip this.
    if (imageUrl && !imageBuffer) {
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

    if (!imageBuffer) {
      return NextResponse.json({ error: 'Failed to generate or retrieve image data.' }, { status: 500 });
    }

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
      model: model,
      imageUrl: publicUrl,
      fileName: fileName,
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
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
  }> = {
    'flux-schnell': { 
      name: 'FLUX Schnell', 
      credits: 1, 
      provider: 'replicate',
      replicateModel: 'black-forest-labs/flux-schnell'
    },
    'flux-dev': { 
      name: 'FLUX Dev', 
      credits: 1, 
      provider: 'replicate',
      replicateModel: 'black-forest-labs/flux-dev'
    },
    'ideogram-turbo': { 
      name: 'Ideogram v2a Turbo', 
      credits: 1, 
      provider: 'replicate', 
      replicateModel: 'ideogram-ai/ideogram-v2a-turbo'
    },
    'playground-v25': { 
      name: 'Playground v2.5', 
      credits: 1, 
      provider: 'replicate', 
      replicateModel: 'playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24'
    },
    'flux-pro': {
      name: 'FLUX 1.1 Pro',
      credits: 2,
      provider: 'replicate',
      replicateModel: 'black-forest-labs/flux-1.1-pro'
    },
    'seedream-3': { 
      name: 'Seedream 3.0', 
      credits: 2, 
      provider: 'replicate', 
      replicateModel: 'bytedance/seedream-3'
    },
    'ideogram-3': { 
      name: 'Ideogram v3 Balanced', 
      credits: 2, 
      provider: 'replicate', 
      replicateModel: 'ideogram-ai/ideogram-v3-balanced'
    },
    'imagen-4': { 
      name: 'Imagen 4', 
      credits: 3, 
      provider: 'replicate', 
      replicateModel: 'google/imagen-4'
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
    const { prompt, model, idToken, aspectRatio } = body;

    console.log('API Request:', { prompt, model, aspectRatio });

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
      const getDalleSize = (ratio: string): '1024x1024' | '1792x1024' | '1024x1792' => {
        switch (ratio) {
          case '16:9': return '1792x1024';
          case '9:16': return '1024x1792';
          case '1:1':
          default:
            return '1024x1024';
        }
      };

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: getDalleSize(aspectRatio),
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
      
      if (!modelConfig.replicateModel) {
        throw new Error('Replicate model not configured');
      }

      const input: any = { prompt };
      
      // Model-specific parameters
      if (model === 'flux-schnell') {
        // FLUX models use aspect_ratio
        input.aspect_ratio = aspectRatio;
        input.output_format = "webp";
        input.output_quality = 90;
        input.go_fast = true;
      } else if (model === 'flux-dev') {
        // FLUX models use aspect_ratio
        input.aspect_ratio = aspectRatio;
        input.output_format = "webp";
        input.output_quality = 90;
      } else if (model === 'flux-pro') {
        // FLUX models use aspect_ratio
        input.aspect_ratio = aspectRatio;
        input.output_format = "webp";
        input.output_quality = 90;
        input.safety_tolerance = 2;
      } else if (model === 'seedream-3') {
        // Seedream-3 has its own parameter structure
        input.aspect_ratio = aspectRatio;
        input.size = "regular"; // regular = 1 megapixel
        input.guidance_scale = 2.5;
      } else if (model === 'ideogram-turbo') {
        // Ideogram v2a Turbo parameter structure
        input.aspect_ratio = aspectRatio;
        input.style_type = "Auto"; // None, Auto, General, Realistic, Design, Render 3D, Anime
        input.magic_prompt_option = "Auto"; // Auto enhances prompt quality
      } else if (model === 'playground-v25') {
        // Playground v2.5 uses width/height instead of aspect_ratio
        const getPlaygroundDimensions = (ratio: string): { width: number; height: number } => {
          switch (ratio) {
            case '16:9': return { width: 1344, height: 768 };
            case '4:3': return { width: 1152, height: 896 };
            case '3:4': return { width: 896, height: 1152 };
            case '9:16': return { width: 768, height: 1344 };
            case '1:1':
            default:
              return { width: 1024, height: 1024 };
          }
        };
        const dimensions = getPlaygroundDimensions(aspectRatio);
        input.width = dimensions.width;
        input.height = dimensions.height;
        input.scheduler = "DPMSolver++"; // Recommended scheduler
        input.guidance_scale = 3; // Recommended for DPMSolver++
        input.num_inference_steps = 25;
        input.apply_watermark = false; // Disable watermarking
      } else if (model === 'ideogram-3') {
        // Ideogram v3 Balanced parameter structure
        input.aspect_ratio = aspectRatio;
        input.style_type = "Auto"; // Auto, General, Realistic, Design
        input.magic_prompt_option = "Auto"; // Auto enhances prompt quality
      } else if (model === 'imagen-4') {
        // Imagen 4 has a simple parameter structure
        input.aspect_ratio = aspectRatio;
        input.output_format = "jpg";
        input.safety_filter_level = "block_only_high"; // Most permissive setting
      }

      console.log('📤 Sending request to Replicate with input:', JSON.stringify(input, null, 2));
      
      try {
        const modelIdentifier = modelConfig.replicateModel;
        const hasVersion = modelIdentifier.includes(':');
        
        let createOptions;
        if (hasVersion) {
          // Model has version hash, use it directly
          const version = modelIdentifier.split(':')[1];
          createOptions = {
            version: version,
            input: input,
          };
        } else {
          // Model without version, use model name
          createOptions = {
            model: modelIdentifier,
            input: input,
          };
        }

        console.log('🚀 Creating Replicate prediction for model:', modelIdentifier);
        
        const prediction = await replicate.predictions.create(createOptions);

        if (!prediction || !prediction.id) {
          throw new Error("Failed to create prediction with Replicate.");
        }

        console.log('⏳ Waiting for prediction to complete...', prediction.id);
        
        // Wait for the prediction to complete
        const result = await replicate.wait(prediction, {});
        
        console.log('✅ Prediction completed successfully');
        console.log('📊 RAW Replicate output:', JSON.stringify(result.output, null, 2));

        // Handle the result
        if (Array.isArray(result.output)) {
          if (result.output.length > 0 && result.output[0]) {
            imageUrl = result.output[0];
          } else {
            throw new Error("No valid image data returned from Replicate. Received empty array.");
          }
        } else if (typeof result.output === 'string') {
          imageUrl = result.output;
        } else {
          throw new Error(`No valid image data returned from Replicate. Received: ${JSON.stringify(result.output)}`);
        }

        console.log('🎯 Final image URL:', imageUrl);

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

    // Download the image from the URL
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL generated.' }, { status: 500 });
    }

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
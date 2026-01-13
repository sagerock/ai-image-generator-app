import { ImageProvider, GenerationRequest, GenerationResult } from './types';

export class GoogleProvider implements ImageProvider {
  name = 'google';
  private apiKey: string;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_AI_API_KEY not set - Google models will not work');
    }
    this.apiKey = apiKey || '';
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, model, aspectRatio } = request;

    if (!this.apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable not set');
    }

    console.log(`🎨 Generating with ${model.name} (${model.providerModelId})`);

    // Use Google's Gemini API for image generation
    // The model ID determines which Gemini model to use
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.providerModelId}:generateContent`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    };

    // Add aspect ratio configuration if supported
    if (aspectRatio !== '1:1') {
      // Parse aspect ratio for Google's format
      const [w, h] = aspectRatio.split(':').map(Number);
      Object.assign(requestBody.generationConfig, {
        aspectRatio: { width: w, height: h }
      });
    }

    console.log('📤 Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google API Error:', errorText);
      throw new Error(`Google API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Raw output:', JSON.stringify(data, null, 2));

    // Extract image from response
    // Gemini returns images as base64 in the response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      throw new Error('No candidates returned from Google API');
    }

    const parts = candidates[0].content?.parts || [];
    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) =>
      part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData) {
      throw new Error('No image data returned from Google API');
    }

    // Convert base64 to data URL for now
    // The generate route will download and re-upload to Firebase Storage
    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

    console.log('✅ Google generation complete');
    return { imageUrl, rawOutput: data };
  }
}

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

    // Determine if this is an Imagen model or Gemini model
    const isImagenModel = model.providerModelId.startsWith('imagen-');

    if (isImagenModel) {
      return this.generateWithImagen(request);
    } else {
      return this.generateWithGemini(request);
    }
  }

  private async generateWithGemini(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, model, aspectRatio } = request;

    // Gemini 2.0 Flash uses generateContent endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.providerModelId}:generateContent`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
      contents: [{
        parts: [{
          text: `Generate an image: ${prompt}`
        }]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    };

    // Add aspect ratio for supported models
    if (aspectRatio && aspectRatio !== '1:1') {
      requestBody.generationConfig.aspectRatio = aspectRatio;
    }

    console.log('📤 Gemini Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', errorText);
      throw new Error(`Gemini API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Gemini Response received');

    // Extract image from Gemini response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      console.error('❌ No candidates in response:', JSON.stringify(data, null, 2));
      throw new Error('No candidates returned from Gemini API');
    }

    const parts = candidates[0].content?.parts || [];
    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) =>
      part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData) {
      console.error('❌ No image data in response:', JSON.stringify(candidates[0], null, 2));
      throw new Error('No image data returned from Gemini API');
    }

    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    console.log('✅ Gemini generation complete');
    return { imageUrl, rawOutput: data };
  }

  private async generateWithImagen(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, model, aspectRatio } = request;

    // Imagen uses the predict endpoint via Generative Language API
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.providerModelId}:predict`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        sampleCount: 1,
      }
    };

    // Add aspect ratio if not 1:1
    if (aspectRatio && aspectRatio !== '1:1') {
      requestBody.parameters.aspectRatio = aspectRatio;
    }

    console.log('📤 Imagen Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Imagen API Error:', errorText);
      throw new Error(`Imagen API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Imagen Response received');

    // Extract image from Imagen response
    const predictions = data.predictions || [];
    if (predictions.length === 0) {
      console.error('❌ No predictions in response:', JSON.stringify(data, null, 2));
      throw new Error('No predictions returned from Imagen API');
    }

    const imageData = predictions[0].bytesBase64Encoded;
    if (!imageData) {
      console.error('❌ No image data in prediction:', JSON.stringify(predictions[0], null, 2));
      throw new Error('No image data returned from Imagen API');
    }

    // Imagen returns PNG by default
    const imageUrl = `data:image/png;base64,${imageData}`;
    console.log('✅ Imagen generation complete');
    return { imageUrl, rawOutput: data };
  }
}

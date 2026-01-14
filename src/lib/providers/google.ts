import { ImageProvider, GenerationRequest, GenerationResult, EditRequest } from './types';

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

    // Gemini image models use the standard generateContent endpoint
    // They natively output images without needing responseModalities
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.providerModelId}:generateContent`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    // Always add image configuration for aspect ratio (don't assume 1:1 is default)
    requestBody.generationConfig = {
      imageConfig: {
        aspectRatio: aspectRatio || '1:1'
      }
    };

    // Add image size for Gemini 3 Pro (supports 1K, 2K, 4K)
    if (model.defaultParams?.imageSize) {
      requestBody.generationConfig.imageConfig.imageSize = model.defaultParams.imageSize;
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

    // Find image part in response
    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) =>
      part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData) {
      // Log any text response for debugging
      const textPart = parts.find((part: { text?: string }) => part.text);
      if (textPart?.text) {
        console.log('📝 Model text response:', textPart.text);
      }
      console.error('❌ No image data in response:', JSON.stringify(candidates[0], null, 2));
      throw new Error('No image data returned from Gemini API');
    }

    // Convert base64 to data URL
    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    console.log('✅ Gemini generation complete');
    return { imageUrl, rawOutput: data };
  }

  async edit(request: EditRequest): Promise<GenerationResult> {
    const { prompt, model, aspectRatio, imageUrl } = request;

    if (!this.apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable not set');
    }

    console.log(`🎨 Editing with ${model.name} (${model.providerModelId})`);

    // Download the source image and convert to base64
    let imageBase64: string;
    let mimeType: string = 'image/png';

    if (imageUrl.startsWith('data:')) {
      // Extract mime type and base64 data from data URL
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      } else {
        imageBase64 = imageUrl.split(',')[1];
      }
    } else {
      const response = await fetch(imageUrl);
      const contentType = response.headers.get('content-type');
      if (contentType) {
        mimeType = contentType;
      }
      const buffer = await response.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString('base64');
    }

    // Gemini uses the same generateContent endpoint for editing
    // Pass the image as inline_data alongside the text prompt
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.providerModelId}:generateContent`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          },
          {
            text: `Edit this image: ${prompt}`
          }
        ]
      }]
    };

    // Add image configuration for aspect ratio
    requestBody.generationConfig = {
      imageConfig: {
        aspectRatio: aspectRatio || '1:1'
      }
    };

    // Add image size for Gemini 3 Pro (supports 1K, 2K, 4K)
    if (model.defaultParams?.imageSize) {
      requestBody.generationConfig.imageConfig.imageSize = model.defaultParams.imageSize;
    }

    console.log('📤 Gemini Edit Request: image + prompt');

    const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini Edit API Error:', errorText);
      throw new Error(`Gemini Edit API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Gemini Edit Response received');

    // Extract image from Gemini response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      console.error('❌ No candidates in edit response:', JSON.stringify(data, null, 2));
      throw new Error('No candidates returned from Gemini Edit API');
    }

    const parts = candidates[0].content?.parts || [];

    // Find image part in response
    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) =>
      part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData) {
      // Log any text response for debugging
      const textPart = parts.find((part: { text?: string }) => part.text);
      if (textPart?.text) {
        console.log('📝 Model text response:', textPart.text);
      }
      console.error('❌ No image data in edit response:', JSON.stringify(candidates[0], null, 2));
      throw new Error('No image data returned from Gemini Edit API');
    }

    // Convert base64 to data URL
    const resultUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    console.log('✅ Gemini edit complete');
    return { imageUrl: resultUrl, rawOutput: data };
  }
}

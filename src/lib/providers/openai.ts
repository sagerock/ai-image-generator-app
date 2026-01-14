import OpenAI, { toFile } from 'openai';
import { ImageProvider, GenerationRequest, GenerationResult, EditRequest } from './types';
import { getGptImageSize } from '../models/dimensions';

type ImageQuality = 'auto' | 'high' | 'low' | 'medium';
type GptImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';

export class OpenAIProvider implements ImageProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, model, aspectRatio } = request;
    const modelId = model.providerModelId;
    const size = getGptImageSize(aspectRatio) as GptImageSize;
    const quality = (model.defaultParams?.quality as ImageQuality) || 'auto';

    console.log(`🎨 Generating with ${model.name} (${modelId}), size: ${size}, quality: ${quality}`);

    // Use the Image API for GPT Image models
    const response = await this.client.images.generate({
      model: modelId,
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality,
    });

    // GPT Image models return base64 data in b64_json field
    const imageData = response.data?.[0];

    if (!imageData) {
      console.error('❌ No image in response:', JSON.stringify(response, null, 2));
      throw new Error('No image returned from OpenAI');
    }

    // Handle both URL and base64 responses
    let imageUrl: string;
    if (imageData.b64_json) {
      imageUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else if (imageData.url) {
      imageUrl = imageData.url;
    } else {
      throw new Error('No image URL or base64 data returned from OpenAI');
    }

    console.log(`✅ ${model.name} generation complete`);
    return { imageUrl, rawOutput: response };
  }

  async edit(request: EditRequest): Promise<GenerationResult> {
    const { prompt, model, aspectRatio, imageUrl } = request;
    const modelId = model.providerModelId;
    const size = getGptImageSize(aspectRatio) as GptImageSize;
    const quality = (model.defaultParams?.quality as ImageQuality) || 'auto';

    console.log(`🎨 Editing with ${model.name} (${modelId}), size: ${size}, quality: ${quality}`);

    // Download the source image and convert to base64
    let imageBase64: string;
    if (imageUrl.startsWith('data:')) {
      imageBase64 = imageUrl.split(',')[1];
    } else {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString('base64');
    }

    // GPT Image models support editing via the edit endpoint with image input
    const editPrompt = `Edit this image: ${prompt}`;

    // Convert base64 to a file-like object using OpenAI's toFile helper
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const imageFile = await toFile(imageBuffer, 'source.png', { type: 'image/png' });

    const response = await this.client.images.edit({
      model: modelId,
      prompt: editPrompt,
      image: imageFile,
      n: 1,
      size: size === 'auto' ? '1024x1024' : size,
    });

    const imageData = response.data?.[0];

    if (!imageData) {
      console.error('❌ No image in edit response:', JSON.stringify(response, null, 2));
      throw new Error('No image returned from OpenAI edit');
    }

    let resultUrl: string;
    if (imageData.b64_json) {
      resultUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else if (imageData.url) {
      resultUrl = imageData.url;
    } else {
      throw new Error('No image URL or base64 data returned from OpenAI edit');
    }

    console.log(`✅ ${model.name} edit complete`);
    return { imageUrl: resultUrl, rawOutput: response };
  }
}

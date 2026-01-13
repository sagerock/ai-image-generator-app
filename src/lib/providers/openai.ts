import OpenAI from 'openai';
import { ImageProvider, GenerationRequest, GenerationResult } from './types';
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
}

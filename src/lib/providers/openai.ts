import OpenAI from 'openai';
import { ImageProvider, GenerationRequest, GenerationResult } from './types';
import { getDalleSize } from '../models/dimensions';

export class OpenAIProvider implements ImageProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, aspectRatio } = request;
    const size = getDalleSize(aspectRatio);

    console.log(`🎨 Generating with DALL-E 3, size: ${size}`);

    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'standard',
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('✅ DALL-E 3 generation complete');
    return { imageUrl, rawOutput: response };
  }
}

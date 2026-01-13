import OpenAI from 'openai';
import { ImageProvider, GenerationRequest, GenerationResult } from './types';
import { getGptImageSize } from '../models/dimensions';

type ImageQuality = 'auto' | 'high' | 'low' | 'medium';

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
    const size = getGptImageSize(aspectRatio);
    const quality = (model.defaultParams?.quality as ImageQuality) || 'auto';

    console.log(`🎨 Generating with ${model.name} (${modelId}), size: ${size}`);

    // Use the new Responses API for GPT Image models
    const response = await this.client.responses.create({
      model: modelId,
      input: prompt,
      tools: [{
        type: 'image_generation',
        size: size,
        quality: quality,
      }],
    });

    // Extract image from response output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = response.output as any[];
    const imageOutput = output?.find((item) =>
      item.type === 'image_generation_call' && item.result
    );

    if (!imageOutput?.result) {
      console.error('❌ No image in response:', JSON.stringify(response, null, 2));
      throw new Error('No image returned from OpenAI');
    }

    // GPT Image returns base64 data
    const imageUrl = `data:image/png;base64,${imageOutput.result}`;

    console.log(`✅ ${model.name} generation complete`);
    return { imageUrl, rawOutput: response };
  }
}

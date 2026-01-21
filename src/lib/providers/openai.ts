import OpenAI, { toFile } from 'openai';
import { File as NodeFile } from 'node:buffer';
import { ImageProvider, GenerationRequest, GenerationResult, EditRequest } from './types';
import { getGptImageSize } from '../models/dimensions';

// Polyfill File for Node.js < 20
if (typeof globalThis.File === 'undefined') {
  // @ts-expect-error - Node.js File polyfill
  globalThis.File = NodeFile;
}

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

    // Use the Responses API for GPT Image models (gpt-image-1, gpt-image-1.5, gpt-image-1-mini)
    if (modelId.startsWith('gpt-image')) {
      return this.generateWithResponsesApi(prompt, model, size, quality);
    }

    // Fall back to Images API for DALL-E models
    const response = await this.client.images.generate({
      model: modelId,
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality,
    });

    // DALL-E models return base64 data in b64_json field
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

  private async generateWithResponsesApi(
    prompt: string,
    model: GenerationRequest['model'],
    size: GptImageSize,
    quality: ImageQuality
  ): Promise<GenerationResult> {
    console.log(`🎨 Using Responses API for ${model.name}`);

    // Use the Responses API with image_generation tool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (this.client as any).responses.create({
      model: model.providerModelId,
      input: prompt,
      tools: [{
        type: 'image_generation',
        size: size,
        quality: quality,
      }],
    });

    // Extract image from response output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageOutput = response.output?.find((output: any) => output.type === 'image_generation_call');

    if (!imageOutput?.result) {
      console.error('❌ No image in Responses API response:', JSON.stringify(response, null, 2));
      throw new Error('No image returned from OpenAI Responses API');
    }

    // The result is base64 image data
    const imageUrl = `data:image/png;base64,${imageOutput.result}`;

    console.log(`✅ ${model.name} generation complete via Responses API`);
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

    // Use the Responses API for GPT Image models
    if (modelId.startsWith('gpt-image')) {
      return this.editWithResponsesApi(prompt, model, imageBase64, size, quality);
    }

    // Fall back to Images API for DALL-E models
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

  private async editWithResponsesApi(
    prompt: string,
    model: EditRequest['model'],
    imageBase64: string,
    size: GptImageSize,
    quality: ImageQuality
  ): Promise<GenerationResult> {
    console.log(`🎨 Using Responses API for editing with ${model.name}`);

    // Use the Responses API with image input and image_generation tool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (this.client as any).responses.create({
      model: model.providerModelId,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `Edit this image: ${prompt}` },
            {
              type: 'input_image',
              image_url: `data:image/png;base64,${imageBase64}`,
            },
          ],
        },
      ],
      tools: [{
        type: 'image_generation',
        size: size,
        quality: quality,
      }],
    });

    // Extract image from response output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageOutput = response.output?.find((output: any) => output.type === 'image_generation_call');

    if (!imageOutput?.result) {
      console.error('❌ No image in Responses API edit response:', JSON.stringify(response, null, 2));
      throw new Error('No image returned from OpenAI Responses API edit');
    }

    // The result is base64 image data
    const resultUrl = `data:image/png;base64,${imageOutput.result}`;

    console.log(`✅ ${model.name} edit complete via Responses API`);
    return { imageUrl: resultUrl, rawOutput: response };
  }
}

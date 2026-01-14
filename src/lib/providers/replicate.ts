import Replicate from 'replicate';
import { ImageProvider, GenerationRequest, GenerationResult, EditRequest } from './types';
import { getDimensions } from '../models/dimensions';

export class ReplicateProvider implements ImageProvider {
  name = 'replicate';
  private client: Replicate;

  constructor() {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN environment variable not set');
    }
    this.client = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, model, aspectRatio } = request;

    // Build input parameters
    const input: Record<string, unknown> = {
      prompt,
      ...model.defaultParams,
    };

    // Add dimension parameters based on model's dimension type
    if (model.dimensionType === 'aspect_ratio') {
      input.aspect_ratio = aspectRatio;
    } else {
      const dims = getDimensions(aspectRatio);
      input.width = dims.width;
      input.height = dims.height;
    }

    console.log(`🎨 Generating with ${model.name} (${model.providerModelId})`);
    console.log('📤 Input:', JSON.stringify(input, null, 2));

    try {
      const modelIdentifier = model.providerModelId;
      const hasVersion = modelIdentifier.includes(':');

      // Create prediction options
      const createOptions = hasVersion
        ? { version: modelIdentifier.split(':')[1], input }
        : { model: modelIdentifier, input };

      console.log('🚀 Creating Replicate prediction...');
      const prediction = await this.client.predictions.create(createOptions as Parameters<typeof this.client.predictions.create>[0]);

      if (!prediction || !prediction.id) {
        throw new Error('Failed to create prediction with Replicate');
      }

      console.log(`⏳ Waiting for prediction ${prediction.id}...`);
      const result = await this.client.wait(prediction, {});

      console.log('✅ Prediction completed');
      console.log('📊 Raw output:', JSON.stringify(result.output, null, 2));

      // Extract image URL from result
      let imageUrl: string;
      if (Array.isArray(result.output) && result.output.length > 0 && result.output[0]) {
        imageUrl = result.output[0];
      } else if (typeof result.output === 'string') {
        imageUrl = result.output;
      } else {
        throw new Error(`Invalid output format from Replicate: ${JSON.stringify(result.output)}`);
      }

      console.log('🎯 Image URL:', imageUrl);
      return { imageUrl, rawOutput: result };

    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; detail?: string };
      console.error('❌ Replicate API Error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.status,
        details: err.detail,
      });
      throw new Error(`Replicate API failed: ${err.message || 'Unknown error'}`);
    }
  }

  async edit(request: EditRequest): Promise<GenerationResult> {
    const { prompt, model, aspectRatio, imageUrl, strength = 0.8 } = request;

    // Build input parameters for image editing
    const input: Record<string, unknown> = {
      prompt,
      ...model.defaultParams,
    };

    // Different models use different parameter names for input image
    // FLUX Kontext uses 'input_image', most others use 'image'
    if (model.providerModelId.includes('flux-kontext')) {
      input.input_image = imageUrl;
    } else {
      input.image = imageUrl;
      input.prompt_strength = strength;
    }

    // Add dimension parameters based on model's dimension type
    if (model.dimensionType === 'aspect_ratio') {
      input.aspect_ratio = aspectRatio;
    } else {
      const dims = getDimensions(aspectRatio);
      input.width = dims.width;
      input.height = dims.height;
    }

    console.log(`🎨 Editing image with ${model.name} (${model.providerModelId})`);
    console.log('📤 Input:', JSON.stringify({ ...input, image: '[image url]' }, null, 2));

    try {
      const modelIdentifier = model.providerModelId;
      const hasVersion = modelIdentifier.includes(':');

      // Create prediction options
      const createOptions = hasVersion
        ? { version: modelIdentifier.split(':')[1], input }
        : { model: modelIdentifier, input };

      console.log('🚀 Creating Replicate edit prediction...');
      const prediction = await this.client.predictions.create(createOptions as Parameters<typeof this.client.predictions.create>[0]);

      if (!prediction || !prediction.id) {
        throw new Error('Failed to create edit prediction with Replicate');
      }

      console.log(`⏳ Waiting for prediction ${prediction.id}...`);
      const result = await this.client.wait(prediction, {});

      console.log('✅ Edit completed');
      console.log('📊 Raw output:', JSON.stringify(result.output, null, 2));

      // Extract image URL from result
      let resultImageUrl: string;
      if (Array.isArray(result.output) && result.output.length > 0 && result.output[0]) {
        resultImageUrl = result.output[0];
      } else if (typeof result.output === 'string') {
        resultImageUrl = result.output;
      } else {
        throw new Error(`Invalid output format from Replicate: ${JSON.stringify(result.output)}`);
      }

      console.log('🎯 Edited Image URL:', resultImageUrl);
      return { imageUrl: resultImageUrl, rawOutput: result };

    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; detail?: string };
      console.error('❌ Replicate Edit API Error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.status,
        details: err.detail,
      });
      throw new Error(`Replicate edit failed: ${err.message || 'Unknown error'}`);
    }
  }
}

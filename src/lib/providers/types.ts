import { ModelConfig, AspectRatio } from '../models/types';

export interface GenerationRequest {
  prompt: string;
  model: ModelConfig;
  aspectRatio: AspectRatio;
}

export interface GenerationResult {
  imageUrl: string;
  rawOutput?: unknown;
}

export interface ImageProvider {
  name: string;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}

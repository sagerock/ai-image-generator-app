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

export interface EditRequest extends GenerationRequest {
  imageUrl: string;      // URL of the image to edit
  strength?: number;     // 0-1, how much to transform (default 0.8)
}

export interface ImageProvider {
  name: string;
  generate(request: GenerationRequest): Promise<GenerationResult>;
  edit?(request: EditRequest): Promise<GenerationResult>;
}

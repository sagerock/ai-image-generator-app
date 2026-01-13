export type Provider = 'openai' | 'replicate' | 'google';
export type ModelTier = 'fast' | 'standard' | 'premium' | 'ultra';

export type AspectRatio =
  | '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  | '3:2' | '2:3' | '1:2' | '2:1' | '1:3' | '3:1'
  | '10:16' | '16:10' | '4:5' | '5:4' | '21:9';

export interface ModelConfig {
  id: string;
  name: string;
  provider: Provider;
  providerModelId: string;
  credits: number;
  tier: ModelTier;
  description: string;
  supportedRatios: AspectRatio[];

  // Provider-specific default parameters
  defaultParams?: Record<string, unknown>;

  // How this model handles dimensions
  dimensionType: 'aspect_ratio' | 'width_height';

  // UI metadata
  tags?: string[];
  estimatedTime?: string;

  // Feature flags
  isActive: boolean;
  isNew?: boolean;
}

export interface DimensionMapping {
  width: number;
  height: number;
}

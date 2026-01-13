import { ModelConfig, ModelTier, AspectRatio } from './types';

// SINGLE SOURCE OF TRUTH for all model configurations
export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // === FAST TIER (1 credit) ===
  'flux-schnell': {
    id: 'flux-schnell',
    name: 'FLUX Schnell',
    provider: 'replicate',
    providerModelId: 'black-forest-labs/flux-schnell',
    credits: 1,
    tier: 'fast',
    description: 'Fast generation, great for testing ideas',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'],
    dimensionType: 'aspect_ratio',
    defaultParams: { output_format: 'webp', output_quality: 90, go_fast: true },
    tags: ['fast', 'versatile'],
    estimatedTime: '~2s',
    isActive: true,
  },

  'nano-banana': {
    id: 'nano-banana',
    name: 'Nano Banana',
    provider: 'google',
    providerModelId: 'gemini-2.5-flash-image',
    credits: 1,
    tier: 'fast',
    description: 'Google Gemini 2.5 Flash - fast image generation with great quality',
    supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2', '4:5', '5:4', '21:9'],
    dimensionType: 'aspect_ratio',
    tags: ['fast', 'google', 'text-rendering'],
    estimatedTime: '~3s',
    isActive: true,
    isNew: true,
  },

  // === STANDARD TIER (2 credits) ===
  'flux-dev': {
    id: 'flux-dev',
    name: 'FLUX Dev',
    provider: 'replicate',
    providerModelId: 'black-forest-labs/flux-dev',
    credits: 2,
    tier: 'standard',
    description: 'High quality, excellent detail (deprecated - use Nano Banana)',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'],
    dimensionType: 'aspect_ratio',
    defaultParams: { output_format: 'webp', output_quality: 90 },
    tags: ['deprecated'],
    estimatedTime: '~5s',
    isActive: false,
  },

  'ideogram-turbo': {
    id: 'ideogram-turbo',
    name: 'Ideogram v2a Turbo',
    provider: 'replicate',
    providerModelId: 'ideogram-ai/ideogram-v2a-turbo',
    credits: 2,
    tier: 'standard',
    description: 'Fast & affordable, great text rendering + multiple styles',
    supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '16:10', '10:16', '3:1', '1:3'],
    dimensionType: 'aspect_ratio',
    defaultParams: { style_type: 'Auto', magic_prompt_option: 'Auto' },
    tags: ['text-rendering', 'versatile'],
    estimatedTime: '~3s',
    isActive: true,
  },

  'seedream-3': {
    id: 'seedream-3',
    name: 'Seedream 3.0',
    provider: 'replicate',
    providerModelId: 'bytedance/seedream-3',
    credits: 2,
    tier: 'standard',
    description: 'Native 2K resolution (deprecated - use Ideogram for text)',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16', '3:2', '2:3'],
    dimensionType: 'aspect_ratio',
    defaultParams: { size: 'regular', guidance_scale: 2.5 },
    tags: ['deprecated'],
    estimatedTime: '~4s',
    isActive: false,
  },

  // === PREMIUM TIER (3 credits) ===
  'flux-pro': {
    id: 'flux-pro',
    name: 'FLUX 1.1 Pro',
    provider: 'replicate',
    providerModelId: 'black-forest-labs/flux-1.1-pro',
    credits: 3,
    tier: 'premium',
    description: 'Faster and improved (deprecated - use DALL-E 3)',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'],
    dimensionType: 'aspect_ratio',
    defaultParams: { output_format: 'webp', output_quality: 90, safety_tolerance: 2 },
    tags: ['deprecated'],
    estimatedTime: '~3s',
    isActive: false,
  },

  'ideogram-3': {
    id: 'ideogram-3',
    name: 'Ideogram v3 Balanced',
    provider: 'replicate',
    providerModelId: 'ideogram-ai/ideogram-v3-balanced',
    credits: 3,
    tier: 'premium',
    description: 'Balance speed, quality & cost, excellent text rendering',
    supportedRatios: ['1:3', '3:1', '1:2', '2:1', '9:16', '16:9', '10:16', '16:10', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '1:1'],
    dimensionType: 'aspect_ratio',
    defaultParams: { style_type: 'Auto', magic_prompt_option: 'Auto' },
    tags: ['text-rendering', 'balanced'],
    estimatedTime: '~5s',
    isActive: true,
  },

  'imagen-4': {
    id: 'imagen-4',
    name: 'Imagen 4',
    provider: 'replicate',
    providerModelId: 'google/imagen-4',
    credits: 3,
    tier: 'premium',
    description: 'Google flagship (deprecated - use Nano Banana Pro)',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'],
    dimensionType: 'aspect_ratio',
    defaultParams: { output_format: 'jpg', safety_filter_level: 'block_only_high' },
    tags: ['deprecated'],
    estimatedTime: '~6s',
    isActive: false,
  },

  'dall-e-3': {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    providerModelId: 'dall-e-3',
    credits: 3,
    tier: 'premium',
    description: 'Legacy model (deprecated May 2026 - use GPT Image 1.5)',
    supportedRatios: ['1:1', '16:9', '9:16'],
    dimensionType: 'width_height',
    tags: ['deprecated'],
    estimatedTime: '~8s',
    isActive: false,
  },

  'gpt-image-mini': {
    id: 'gpt-image-mini',
    name: 'GPT Image Mini',
    provider: 'openai',
    providerModelId: 'gpt-image-1-mini',
    credits: 1,
    tier: 'fast',
    description: 'Fast & affordable OpenAI image generation',
    supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
    dimensionType: 'width_height',
    defaultParams: { quality: 'auto' },
    tags: ['fast', 'openai'],
    estimatedTime: '~3s',
    isActive: true,
    isNew: true,
  },

  'gpt-image': {
    id: 'gpt-image',
    name: 'GPT Image',
    provider: 'openai',
    providerModelId: 'gpt-image-1',
    credits: 2,
    tier: 'standard',
    description: 'Balanced OpenAI image generation',
    supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
    dimensionType: 'width_height',
    defaultParams: { quality: 'auto' },
    tags: ['balanced', 'openai'],
    estimatedTime: '~5s',
    isActive: true,
    isNew: true,
  },

  'gpt-image-hd': {
    id: 'gpt-image-hd',
    name: 'GPT Image 1.5',
    provider: 'openai',
    providerModelId: 'gpt-image-1.5',
    credits: 3,
    tier: 'premium',
    description: 'State-of-the-art OpenAI image generation, best quality',
    supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
    dimensionType: 'width_height',
    defaultParams: { quality: 'high' },
    tags: ['premium', 'openai', 'best-quality'],
    estimatedTime: '~8s',
    isActive: true,
    isNew: true,
  },

  'recraft-v3': {
    id: 'recraft-v3',
    name: 'Recraft V3',
    provider: 'replicate',
    providerModelId: 'recraft-ai/recraft-v3',
    credits: 3,
    tier: 'premium',
    description: 'Design & vector specialist, perfect for logos and illustrations',
    supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    dimensionType: 'aspect_ratio',
    defaultParams: { style: 'any' },
    tags: ['design', 'vector', 'logos'],
    estimatedTime: '~5s',
    isActive: true,
    isNew: true,
  },

  // === ULTRA TIER (4 credits) ===
  'flux-ultra': {
    id: 'flux-ultra',
    name: 'FLUX 1.1 Pro Ultra',
    provider: 'replicate',
    providerModelId: 'black-forest-labs/flux-1.1-pro-ultra',
    credits: 4,
    tier: 'ultra',
    description: 'Maximum quality FLUX (deprecated - use Nano Banana Pro)',
    supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
    dimensionType: 'aspect_ratio',
    defaultParams: { output_format: 'jpg', output_quality: 95 },
    tags: ['deprecated'],
    estimatedTime: '~10s',
    isActive: false,
  },

  'nano-banana-pro': {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'google',
    providerModelId: 'gemini-3-pro-image-preview',
    credits: 4,
    tier: 'ultra',
    description: 'Google Gemini 3 Pro - premium quality with thinking, 4K output, and Google Search grounding',
    supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2', '4:5', '5:4', '21:9'],
    dimensionType: 'aspect_ratio',
    defaultParams: { imageSize: '2K' },
    tags: ['google', 'premium', 'text-rendering', '4k', 'thinking'],
    estimatedTime: '~10s',
    isActive: true,
    isNew: true,
  },

  // === DEPRECATED MODELS (kept for historical gallery display) ===
  'lcm': {
    id: 'lcm',
    name: 'LCM (Latent Consistency)',
    provider: 'replicate',
    providerModelId: 'fofr/latent-consistency-model:683d19dc312f7a9f0428b04429a9ccefd28dbf7785fef083ad5cf991b65f406f',
    credits: 1,
    tier: 'fast',
    description: 'Ultra-fast 0.6s generation (deprecated)',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'],
    dimensionType: 'width_height',
    tags: ['deprecated'],
    isActive: false,
  },

  'realistic-vision': {
    id: 'realistic-vision',
    name: 'Realistic Vision v5.1',
    provider: 'replicate',
    providerModelId: 'lucataco/realistic-vision-v5.1:2c8e954decbf70b7607a4414e5785ef9e4de4b8c51d50fb8b8b349160e0ef6bb',
    credits: 1,
    tier: 'fast',
    description: 'Photorealistic specialist (deprecated)',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'],
    dimensionType: 'width_height',
    tags: ['deprecated'],
    isActive: false,
  },

  'proteus-v03': {
    id: 'proteus-v03',
    name: 'Proteus v0.3',
    provider: 'replicate',
    providerModelId: 'datacte/proteus-v0.3:b28b79d725c8548b173b6a19ff9bffd16b9b80df5b18b8dc5cb9e1ee471bfa48',
    credits: 1,
    tier: 'fast',
    description: 'Anime specialist (deprecated)',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'],
    dimensionType: 'width_height',
    tags: ['deprecated'],
    isActive: false,
  },

  'playground-v25': {
    id: 'playground-v25',
    name: 'Playground v2.5',
    provider: 'replicate',
    providerModelId: 'playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24',
    credits: 5,
    tier: 'ultra',
    description: 'State-of-the-art aesthetic quality (deprecated)',
    supportedRatios: ['1:1', '16:9', '4:3', '3:4', '9:16'],
    dimensionType: 'width_height',
    tags: ['deprecated'],
    isActive: false,
  },
};

// Helper functions
export function getActiveModels(): ModelConfig[] {
  return Object.values(MODEL_REGISTRY).filter(m => m.isActive);
}

export function getModelsByTier(tier: ModelTier): ModelConfig[] {
  return getActiveModels().filter(m => m.tier === tier);
}

export function getModel(id: string): ModelConfig | undefined {
  return MODEL_REGISTRY[id];
}

export function getModelCredits(id: string): number {
  return MODEL_REGISTRY[id]?.credits ?? 2;
}

export function getModelName(id: string): string {
  return MODEL_REGISTRY[id]?.name ?? id.toUpperCase();
}

// Get all unique aspect ratios across all active models
export function getAllSupportedRatios(): AspectRatio[] {
  const ratioSet = new Set<AspectRatio>();
  getActiveModels().forEach(m => {
    m.supportedRatios.forEach(r => ratioSet.add(r));
  });
  return Array.from(ratioSet);
}

// Re-export types
export * from './types';

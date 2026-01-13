import { AspectRatio, DimensionMapping } from './types';

// Standard dimension mappings for width/height based models
// These are optimized for ~1 megapixel output
const STANDARD_DIMENSIONS: Record<AspectRatio, DimensionMapping> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
  '3:2': { width: 1216, height: 832 },
  '2:3': { width: 832, height: 1216 },
  '1:2': { width: 704, height: 1408 },
  '2:1': { width: 1408, height: 704 },
  '1:3': { width: 576, height: 1728 },
  '3:1': { width: 1728, height: 576 },
  '10:16': { width: 800, height: 1280 },
  '16:10': { width: 1280, height: 800 },
  '4:5': { width: 896, height: 1120 },
  '5:4': { width: 1120, height: 896 },
  '21:9': { width: 1536, height: 640 },
};

// DALL-E specific sizes (OpenAI only supports these exact sizes)
type DalleSize = '1024x1024' | '1792x1024' | '1024x1792';
const DALLE_SIZES: Record<string, DalleSize> = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
};

/**
 * Get width/height dimensions for a given aspect ratio
 * Used by models that require explicit width/height parameters
 */
export function getDimensions(ratio: AspectRatio): DimensionMapping {
  return STANDARD_DIMENSIONS[ratio] ?? STANDARD_DIMENSIONS['1:1'];
}

/**
 * Get DALL-E specific size string for a given aspect ratio
 * DALL-E only supports 1:1, 16:9, and 9:16
 */
export function getDalleSize(ratio: AspectRatio): DalleSize {
  return DALLE_SIZES[ratio] ?? '1024x1024';
}

/**
 * Check if an aspect ratio is valid
 */
export function isValidRatio(ratio: string): ratio is AspectRatio {
  return ratio in STANDARD_DIMENSIONS;
}

/**
 * Parse an aspect ratio string into width/height numbers
 * e.g., "16:9" -> { w: 16, h: 9 }
 */
export function parseRatio(ratio: AspectRatio): { w: number; h: number } {
  const [w, h] = ratio.split(':').map(Number);
  return { w, h };
}

/**
 * Image format detection utilities
 */

export interface ImageInfo {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

/**
 * Detect image format from magic bytes
 */
function detectFormatFromBytes(buffer: Buffer): { mimeType: string; extension: string } | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  // GIF: GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { mimeType: 'image/gif', extension: 'gif' };
  }

  return null;
}

/**
 * Get extension from mime type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeToExt[mimeType] || 'png';
}

/**
 * Process image from a data URL (base64)
 * Returns the buffer and detected format info
 */
export function processBase64Image(dataUrl: string): ImageInfo {
  // Extract mime type from data URL: data:image/png;base64,...
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  let mimeType = 'image/png';
  let base64Data: string;

  if (matches) {
    mimeType = matches[1];
    base64Data = matches[2];
  } else {
    // Fallback: just get the base64 part
    base64Data = dataUrl.split(',')[1];
  }

  const buffer = Buffer.from(base64Data, 'base64');

  // Verify with magic bytes (in case mime type is wrong)
  const detected = detectFormatFromBytes(buffer);
  if (detected) {
    mimeType = detected.mimeType;
  }

  const extension = getExtensionFromMimeType(mimeType);

  return { buffer, mimeType, extension };
}

/**
 * Download image from URL and detect its format
 * Returns the buffer and detected format info
 */
export async function downloadImage(imageUrl: string): Promise<ImageInfo> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // Try to detect format from magic bytes first (most reliable)
  const detected = detectFormatFromBytes(buffer);
  if (detected) {
    return { buffer, mimeType: detected.mimeType, extension: detected.extension };
  }

  // Fall back to content-type header
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.startsWith('image/')) {
    const mimeType = contentType.split(';')[0].trim();
    const extension = getExtensionFromMimeType(mimeType);
    return { buffer, mimeType, extension };
  }

  // Default to PNG if we can't detect
  return { buffer, mimeType: 'image/png', extension: 'png' };
}

import Jimp from 'jimp'
import { Buffer } from 'node:buffer'

export interface ProcessedImage {
  original: Buffer
  blurred: Buffer
  extension: string
}

/**
 * Processes an image to create optimized original and blurred preview version
 * @param base64Data Base64 encoded image data
 * @param blurRadius Blur radius (1-100, default: 25)
 * @param quality JPEG quality for both images (default: 85)
 * @param maxWidth Maximum width for original image (default: 2048)
 * @param previewMaxWidth Maximum width for preview (default: 800)
 * @returns Processed image buffers
 */
export async function processImage(
  base64Data: string,
  blurRadius: number = 25,
  quality: number = 85,
  maxWidth: number = 2048,
  previewMaxWidth: number = 800
): Promise<ProcessedImage> {
  try {
    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')

    // Decode base64 to buffer
    const imageBuffer = Buffer.from(base64Clean, 'base64')

    // Determine extension from original data or default to jpg
    const extension = base64Data.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpg'

    // Load image with Jimp
    const image = await Jimp.read(imageBuffer)

    // Resize original if needed (maintain aspect ratio)
    if (image.getWidth() > maxWidth) {
      image.resize(maxWidth, Jimp.AUTO)
    }

    // Get optimized original buffer
    const original = await image
      .quality(quality)
      .getBufferAsync(Jimp.MIME_JPEG)

    // Create blurred preview version
    const previewImage = image.clone()

    // Resize preview if needed
    if (previewImage.getWidth() > previewMaxWidth) {
      previewImage.resize(previewMaxWidth, Jimp.AUTO)
    }

    const blurred = await previewImage
      .blur(blurRadius)
      .quality(quality)
      .getBufferAsync(Jimp.MIME_JPEG)

    return {
      original,
      blurred,
      extension: 'jpg', // Always save as JPEG after compression
    }
  } catch (error) {
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generates a blurred preview filename from original path
 * @param originalPath Original file path (e.g., "abc123.jpg")
 * @returns Preview path (e.g., "abc123-blurred.jpg")
 */
export function getBlurredPath(originalPath: string): string {
  const lastDot = originalPath.lastIndexOf('.')
  if (lastDot === -1) {
    return `${originalPath}-blurred`
  }

  const basePath = originalPath.substring(0, lastDot)
  const extension = originalPath.substring(lastDot)

  return `${basePath}-blurred${extension}`
}

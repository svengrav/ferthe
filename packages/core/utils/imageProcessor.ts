import Jimp from 'jimp'
import { Buffer } from 'node:buffer'

export interface ProcessedImage {
  original: Buffer
  blurred: Buffer
  extension: string
}

/**
 * Processes an image to create a blurred preview version
 * @param base64Data Base64 encoded image data
 * @param blurRadius Blur radius (1-100, default: 10)
 * @param previewQuality JPEG quality for preview (default: 60)
 * @returns Processed image buffers
 */
export async function processImage(
  base64Data: string,
  blurRadius: number = 10,
  previewQuality: number = 60
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

    // Get original buffer
    const original = await image.getBufferAsync(Jimp.MIME_JPEG)

    // Create blurred version
    const blurred = await image
      .clone()
      .blur(blurRadius)
      .quality(previewQuality)
      .getBufferAsync(Jimp.MIME_JPEG)

    return {
      original,
      blurred,
      extension: extension === 'jpeg' ? 'jpg' : extension,
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

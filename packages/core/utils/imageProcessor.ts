import { Buffer } from 'node:buffer'
import sharp from 'sharp'

export interface ProcessedImage {
  original: Buffer
  blurred?: Buffer
  micro?: Buffer
  extension: string
}

export interface ImageProcessingOptions {
  quality?: number
  maxWidth?: number
  previewMaxWidth?: number
  microSize?: number
  blurRadius?: number
  blur?: boolean
  micro?: boolean
}

/**
 * Processes an image to create optimized original and optional blurred preview + micro thumbnail
 * @param base64Data Base64 encoded image data
 * @param options Processing options with quality, dimensions, blur radius, and createBlur/micro flags
 * @returns Processed image buffers (WebP format)
 */
export async function processImage(
  base64Data: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    quality = 85,
    maxWidth = 2048,
    previewMaxWidth = 800,
    microSize = 40,
    blurRadius = 25,
    blur = false,
    micro = false,
  } = options
  try {
    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')

    // Decode base64 to buffer
    const imageBuffer = Buffer.from(base64Clean, 'base64')

    // Load image with Sharp and get metadata
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    // Resize original if needed (maintain aspect ratio)
    const originalResized = metadata.width && metadata.width > maxWidth
      ? image.resize(maxWidth, undefined, { withoutEnlargement: true })
      : image

    // Get optimized original buffer (WebP format)
    const original = await originalResized
      .webp({ quality })
      .toBuffer()

    // Create blurred preview version if requested
    let blurred: Buffer | undefined
    if (blur) {
      const previewResized = metadata.width && metadata.width > previewMaxWidth
        ? sharp(imageBuffer).resize(previewMaxWidth, undefined, { withoutEnlargement: true })
        : sharp(imageBuffer)

      blurred = await previewResized
        .blur(blurRadius)
        .webp({ quality })
        .toBuffer()
    }

    // Create micro thumbnail if requested (tiny, sharp, for instant previews)
    let microBuffer: Buffer | undefined
    if (micro) {
      microBuffer = await sharp(imageBuffer)
        .resize(microSize, microSize, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: 80 })
        .toBuffer()
    }

    return {
      original,
      blurred,
      micro: microBuffer,
      extension: 'webp',
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

/**
 * Generates a micro thumbnail filename from original path
 * @param originalPath Original file path (e.g., "abc123.jpg")
 * @returns Micro path (e.g., "abc123-micro.jpg")
 */
export function getMicroPath(originalPath: string): string {
  const lastDot = originalPath.lastIndexOf('.')
  if (lastDot === -1) {
    return `${originalPath}-micro`
  }

  const basePath = originalPath.substring(0, lastDot)
  const extension = originalPath.substring(lastDot)

  return `${basePath}-micro${extension}`
}

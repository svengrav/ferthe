import { createCuid2 } from '@core/utils/idGenerator.ts'
import { API_ERROR_CODES } from '@shared/contracts/errors.ts'
import { ImageType } from '@shared/contracts/images.ts'
import { Result, createErrorResult, createSuccessResult } from '@shared/contracts/results.ts'

/**
 * Internal metadata interface for blob storage.
 * This data is stored as Azure Blob metadata (not visible via public URLs).
 */
interface ImageBlobMetadata {
  imageType: ImageType
  ownerId: string // accountId that owns this image
  entityId: string // discoveryId, spotId, trailId, or accountId
  uploadedAt: string // ISO timestamp
}

/**
 * Generate a secure, anonymous blob path using CUID2.
 * Path contains no identifiable information - all metadata stored separately.
 * 
 * @param extension - File extension (e.g., 'jpg', 'png')
 * @returns Secure blob path like "clz8a9b2c3d4e5f6.jpg"
 */
export const generateSecureImagePath = (extension: string = 'jpg'): string => {
  const hash = createCuid2()
  return `${hash}.${extension}`
}

/**
 * Create blob metadata for tracking ownership and context.
 * This metadata is stored on the blob itself (not visible via public URLs).
 * 
 * @param imageType - Type of image being uploaded
 * @param ownerId - Account ID that owns this image
 * @param entityId - Related entity ID (discoveryId, spotId, etc.)
 * @returns Metadata object for blob storage
 */
export const createImageMetadata = (
  imageType: ImageType,
  ownerId: string,
  entityId: string
): ImageBlobMetadata => {
  return {
    imageType,
    ownerId,
    entityId,
    uploadedAt: new Date().toISOString(),
  }
}

/**
 * Extract blob path from a SAS-signed URL.
 * Removes the base URL and SAS query parameters.
 * 
 * @param imageUrl - Full SAS-signed URL
 * @returns Blob path (e.g., "clz8a9b2c3d4e5f6.jpg")
 */
export const extractBlobPathFromUrl = (imageUrl: string): string => {
  try {
    const url = new URL(imageUrl)
    // Remove leading slash and extract path
    const path = url.pathname.split('/').pop() || ''
    return path
  } catch (_error) {
    throw new Error(`Invalid image URL: ${imageUrl}`)
  }
}

/**
 * Validate that the file extension is supported.
 * 
 * @param extension - File extension to validate
 * @returns True if supported
 */
export const isSupportedExtension = (extension: string): boolean => {
  const supported = ['jpg', 'jpeg', 'png', 'webp']
  return supported.includes(extension.toLowerCase())
}

/**
 * Detect image extension from base64 data URI.
 * 
 * @param dataUri - Base64 data URI (e.g., "data:image/jpeg;base64,...")
 * @returns Extension string (e.g., "jpg")
 */
export const detectExtensionFromDataUri = (dataUri: string): string => {
  const match = dataUri.match(/^data:image\/(\w+);base64,/)
  if (!match) {
    return 'jpg' // Default fallback
  }

  const mimeType = match[1].toLowerCase()
  return mimeType === 'jpeg' ? 'jpg' : mimeType
}

/**
 * Validate image size from base64 string.
 * 
 * @param base64Data - Base64 encoded image (with or without data URI prefix)
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Result with size validation
 */
export const validateImageSize = (base64Data: string, maxSizeBytes: number): Result<void> => {
  if (!base64Data) {
    const error = API_ERROR_CODES.NO_IMAGE_DATA
    return createErrorResult(error.code as any)
  }

  // Extract pure base64 (remove data URI prefix if present)
  const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data

  // Calculate size: Base64 encoding uses 4 chars for 3 bytes
  const sizeBytes = (base64String.length * 3) / 4

  if (sizeBytes > maxSizeBytes) {
    const error = API_ERROR_CODES.IMAGE_TOO_LARGE
    return createErrorResult(error.code as any, {
      maxSizeMB: maxSizeBytes / (1024 * 1024),
      actualSizeMB: Math.round(sizeBytes / (1024 * 1024) * 10) / 10
    })
  }

  return createSuccessResult(undefined)
}

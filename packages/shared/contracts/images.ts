import { AccountContext } from './accounts.ts'
import { Result } from './results.ts'

/**
 * Types of images used in the application.
 * Determines the context and ownership rules for image uploads.
 */
export type ImageType = 'discovery' | 'spot' | 'trail' | 'account-avatar'

/**
 * Image reference used in domain entities.
 * Contains the unique identifier and the signed URL for accessing the image.
 */
export interface ImageReference {
  id: string // The blob hash (CUID2)
  url: string // SAS-signed URL for read access
  label?: string // Optional label for text fallback (first 2 chars displayed)
}

export interface ImageUploadResult {
  blobPath: string
}

/**
 * Application contract for managing image uploads and deletions.
 */
export interface ImageApplicationContract {
  /**
   * Upload an image and get back blob path.
   * The blob path is a secure hash (CUID2) to prevent enumeration.
   */
  uploadImage: (
    context: AccountContext,
    imageType: ImageType,
    entityId: string,
    base64Data: string,
    extension?: string
  ) => Promise<Result<ImageUploadResult>>

  /**
   * Delete an image by extracting the blob path from the URL.
   * Validates ownership through blob metadata.
   */
  deleteImage: (context: AccountContext, imageUrl: string) => Promise<Result<void>>

  /**
   * Generate a new signed URL for an existing image.
   * Useful when SAS tokens expire.
   */
  refreshImageUrl: (context: AccountContext, imageUrl: string) => Promise<Result<string>>
}

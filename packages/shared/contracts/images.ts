import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { Result } from './results.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────────────────────

/**
 * Types of images used in the application
 */
export const ImageTypeSchema = z.enum([
  'discovery',
  'spot',
  'trail',
  'trail-preview',
  'trail-surface',
  'trail-viewport',
  'trail-overview',
  'account-avatar',
])

/**
 * Image reference used in domain entities
 */
export const ImageReferenceSchema = z.object({
  id: z.string(), // The blob hash (CUID2)
  url: z.string().url(), // SAS-signed URL for read access
  label: z.string().optional(), // Optional label for text fallback (first 2 chars displayed)
})

export const ImageUploadResultSchema = z.object({
  blobPath: z.string(),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod)
// ──────────────────────────────────────────────────────────────

/**
 * Types of images used in the application.
 * Determines the context and ownership rules for image uploads.
 * 
 * Trail images:
 *  - trail-preview: Trail card/header image
 *  - trail-surface: Map surface background (moves with trail boundary in Canvas mode)
 *  - trail-viewport: Viewport background (static, does not move in Canvas mode)
 *  - trail-overview: Overview mode background (full trail boundary in Overview mode)
 */
export type ImageType = z.infer<typeof ImageTypeSchema>

/**
 * Image reference used in domain entities.
 * Contains the unique identifier and the signed URL for accessing the image.
 */
export type ImageReference = z.infer<typeof ImageReferenceSchema>

export type ImageUploadResult = z.infer<typeof ImageUploadResultSchema>

/**
 * Application contract for managing image uploads and deletions.
 */
export interface ImageProcessOptions {
  /**
   * Process the image through sharp (resize, compress to WebP).
   * If false, stores original format as-is.
   * Default: true
   */
  processImage?: boolean
  /**
   * Create a blurred preview variant for sensitive/spoiler content.
   * Ignored if processImage is false.
   * Default: false
   */
  blur?: boolean
  /**
   * Create a micro thumbnail (40x40px) for instant preview.
   * Used for clues / list items to show instant visual feedback.
   * Ignored if processImage is false.
   * Default: false
   */
  micro?: boolean
}

export interface ImageApplicationContract {
  /**
   * Process and store an image, get back blob path.
   * The blob path is a secure hash (CUID2) to prevent enumeration.
   * Actual processing (resize, compression, blur) is determined by options.
   */
  processAndStore: (
    context: AccountContext,
    imageType: ImageType,
    entityId: string,
    base64Data: string,
    options?: ImageProcessOptions & { extension?: string }
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

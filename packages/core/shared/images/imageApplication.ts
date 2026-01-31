import { AccountContext } from '@shared/contracts/accounts.ts'
import { ImageApplicationContract, ImageType } from '@shared/contracts/images.ts'
import { createErrorResult, createSuccessResult, Result } from '@shared/contracts/results.ts'
import { Buffer } from 'node:buffer'
import {
  createImageMetadata,
  detectExtensionFromDataUri,
  extractBlobPathFromUrl,
  generateSecureImagePath,
  isSupportedExtension,
} from './imageService.ts'

interface ImageApplicationOptions {
  storageConnector: {
    uploadFile: (path: string, data: Buffer, metadata?: Record<string, string>) => Promise<string>
    deleteFile: (path: string) => Promise<void>
    getMetadata: (path: string) => Promise<Record<string, string>>
    getItemUrl: (path: string) => Promise<{ id: string; url: string }>
  }
}

export function createImageApplication({ storageConnector }: ImageApplicationOptions): ImageApplicationContract {
  const uploadImage = async (
    context: AccountContext,
    imageType: ImageType,
    entityId: string,
    base64Data: string,
    extension?: string
  ): Promise<Result<string>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Detect extension from data URI if not provided
      let ext = extension
      if (!ext && base64Data.startsWith('data:image')) {
        ext = detectExtensionFromDataUri(base64Data)
      }
      ext = ext || 'jpg'

      // Validate extension
      if (!isSupportedExtension(ext)) {
        return createErrorResult('INVALID_IMAGE_FORMAT', { extension: ext })
      }

      // Extract base64 data (remove data URI prefix if present)
      const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
      const buffer = Buffer.from(base64String, 'base64')

      // Generate secure blob path (hash-based, no identifiable info)
      const blobPath = generateSecureImagePath(ext)

      // Create metadata (stored on blob, not visible via public URL)
      const metadata = createImageMetadata(imageType, accountId, entityId)

      // Convert metadata to Record<string, string> for blob storage
      const blobMetadata: Record<string, string> = {
        imageType: metadata.imageType,
        ownerId: metadata.ownerId,
        entityId: metadata.entityId,
        uploadedAt: metadata.uploadedAt,
      }

      // Upload to storage with metadata
      const imageUrl = await storageConnector.uploadFile(blobPath, buffer, blobMetadata)

      return createSuccessResult(imageUrl)
    } catch (error: any) {
      return createErrorResult('IMAGE_UPLOAD_ERROR', { originalError: error.message })
    }
  }

  const deleteImage = async (context: AccountContext, imageUrl: string): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Extract blob path from URL
      const blobPath = extractBlobPathFromUrl(imageUrl)

      // Get blob metadata to verify ownership
      const metadata = await storageConnector.getMetadata(blobPath)
      const ownerId = metadata.ownerId || metadata.ownerid // Azure lowercases metadata keys

      if (ownerId !== accountId) {
        return createErrorResult('NOT_AUTHORIZED', { message: 'Cannot delete image owned by another account' })
      }

      // Delete the blob
      await storageConnector.deleteFile(blobPath)

      return createSuccessResult(undefined)
    } catch (error: any) {
      return createErrorResult('DELETE_IMAGE_ERROR', { originalError: error.message })
    }
  }

  const refreshImageUrl = async (context: AccountContext, imageUrl: string): Promise<Result<string>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Extract blob path from URL
      const blobPath = extractBlobPathFromUrl(imageUrl)

      // Generate new SAS token
      const item = await storageConnector.getItemUrl(blobPath)

      return createSuccessResult(item.url)
    } catch (error: any) {
      return createErrorResult('REFRESH_IMAGE_URL_ERROR', { originalError: error.message })
    }
  }

  return {
    uploadImage,
    deleteImage,
    refreshImageUrl,
  }
}

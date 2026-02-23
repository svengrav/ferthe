import { AccountContext } from '@shared/contracts/accounts.ts'
import { ImageApplicationContract, ImageProcessOptions, ImageType, ImageUploadResult } from '@shared/contracts/images.ts'
import { createErrorResult, createSuccessResult, Result } from '@shared/contracts/results.ts'
import { Buffer } from 'node:buffer'
import { StorageConnector } from '../../connectors/storageConnector.ts'
import { getBlurredPath, getMicroPath, processImage } from '../../utils/imageProcessor.ts'
import {
  createImageMetadata,
  detectExtensionFromDataUri,
  extractBlobPathFromUrl,
  generateImageId,
  isSupportedExtension,
  validateImageSize,
} from './imageService.ts'

interface ImageApplicationOptions {
  storageConnector: StorageConnector
  maxImageSizeBytes: number
}

export function createImageApplication({ storageConnector, maxImageSizeBytes }: ImageApplicationOptions): ImageApplicationContract {
  const processAndStore = async (
    context: AccountContext,
    imageType: ImageType,
    entityId: string,
    base64Data: string,
    options: (ImageProcessOptions & { extension?: string }) = {}
  ): Promise<Result<ImageUploadResult>> => {
    const { processImage: shouldProcess = true, blur = false, micro = false, extension: optionExt } = options

    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Validate image size
      const sizeValidation = validateImageSize(base64Data, maxImageSizeBytes)
      if (!sizeValidation.success) {
        return { ...sizeValidation, data: undefined }
      }
      // Detect extension from data URI if not provided
      let ext = optionExt
      if (!ext && base64Data.startsWith('data:image')) {
        ext = detectExtensionFromDataUri(base64Data)
      }
      ext = ext || 'jpg'

      // Validate extension
      if (!isSupportedExtension(ext)) {
        return createErrorResult('INVALID_IMAGE_FORMAT', { extension: ext })
      }

      // Create metadata (stored on blob, not visible via public URL)
      const metadata = createImageMetadata(imageType, accountId, entityId)

      // Convert metadata to Record<string, string> for blob storage
      const blobMetadata: Record<string, string> = {
        imageType: metadata.imageType,
        ownerId: metadata.ownerId,
        entityId: metadata.entityId,
        uploadedAt: metadata.uploadedAt,
      }

      if (shouldProcess) {
        // Process image (resize, compress, optional blur, optional micro)
        const processed = await processImage(base64Data, { blur, micro })

        // Generate image ID with processed extension (webp after processing)
        const blobPath = generateImageId(processed.extension)

        // Store optimized original
        await storageConnector.uploadFile(blobPath, processed.original, blobMetadata)

        // Store blurred variant if present
        if (processed.blurred) {
          const blurredPath = getBlurredPath(blobPath)
          const previewMetadata = { ...blobMetadata, type: 'preview' }
          await storageConnector.uploadFile(blurredPath, processed.blurred, previewMetadata)
        }

        // Store micro thumbnail if present
        if (processed.micro) {
          const microPath = getMicroPath(blobPath)
          const microMetadata = { ...blobMetadata, type: 'micro' }
          await storageConnector.uploadFile(microPath, processed.micro, microMetadata)
        }

        return createSuccessResult({ blobPath })
      }

      // Store original without processing
      const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
      const buffer = Buffer.from(base64String, 'base64')
      const blobPath = generateImageId(ext)

      await storageConnector.uploadFile(blobPath, buffer, blobMetadata)

      return createSuccessResult({ blobPath })
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

  const refreshImageUrl = async (context: AccountContext, blobPath: string): Promise<Result<string>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Generate new SAS token for blob path
      const item = await storageConnector.getItemUrl(blobPath)

      if (!item) {
        return createErrorResult('REFRESH_IMAGE_URL_ERROR', { originalError: 'Item not found' })
      }

      return createSuccessResult(item.url)
    } catch (error: any) {
      return createErrorResult('REFRESH_IMAGE_URL_ERROR', { originalError: error.message })
    }
  }

  return {
    processAndStore,
    deleteImage,
    refreshImageUrl,
  }
}

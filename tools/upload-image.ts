/**
 * Image Upload Tool
 * ---
 * Upload images to Azure Blob Storage with proper metadata
 * 
 * Environment Variables:
 *   AZURE_STORAGE_CONNECTION_STRING  Azure Storage connection string (required)
 *                                     Set via environment or .env file
 * 
 * Usage:
 *   deno run --allow-all tools/upload-image.ts <image-path> [options]
 * 
 * Options:
 *   --type <type>      Image type: account-avatar | discovery | spot | trail | trail-preview | trail-surface | trail-viewport | trail-overview (default: discovery)
 *   --owner <id>       Owner account ID (default: system)
 *   --entity <id>      Entity ID (default: auto-generated)
 *   --id <id>          Specific blob path ID for updates (default: auto-generated CUID2)
 * 
 * Examples:
 *   deno run --allow-all tools/upload-image.ts ./photo.jpg --type spot --owner acc123
 *   deno run --allow-all tools/upload-image.ts ./photo.jpg --id spot_xyz789 --type spot
 *   deno run --allow-all tools/upload-image.ts ./avatar.png --type account-avatar
 * 
 * Note: Processing options (blur, etc.) are determined by image type configured in the tool
 */

import { createAzureStorageConnector } from '@core/connectors/storageConnector.ts'
import { createImageMetadata, generateImageId } from '@core/shared/images/imageService.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { getBlurredPath, processImage } from '@core/utils/imageProcessor.ts'
import * as dotenv from 'dotenv'
import { Buffer } from 'node:buffer'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Load .env from project root (parent directory of tools/)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

interface UploadOptions {
  imagePath: string
  imageType: 'account-avatar' | 'discovery' | 'spot' | 'trail' | 'trail-preview' | 'trail-surface' | 'trail-viewport' | 'trail-overview'
  ownerId: string
  entityId: string
  customId?: string
}

const parseArgs = (): UploadOptions => {
  const args = Deno.args

  if (args.length === 0) {
    console.error('❌ Error: Image path is required')
    console.log('Usage: deno run --allow-all tools/upload-image.ts <image-path> [options]')
    Deno.exit(1)
  }

  const imagePath = args[0]
  const imageType = getArg('--type', 'discovery') as UploadOptions['imageType']
  const ownerId = getArg('--owner', 'system')
  const entityId = getArg('--entity', createCuid2())
  const customId = getArg('--id', '')

  return { imagePath, imageType, ownerId, entityId, customId: customId || undefined }
}

const getArg = (flag: string, defaultValue: string): string => {
  const index = Deno.args.indexOf(flag)
  return index !== -1 && Deno.args[index + 1] ? Deno.args[index + 1] : defaultValue
}

const detectExtension = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase()
  return ext || 'jpg'
}

const uploadImage = async (options: UploadOptions) => {
  console.log('🚀 Image Upload Tool')
  console.log('---')

  // Get Azure Storage connection string from environment
  const connectionString = Deno.env.get('AZURE_STORAGE_CONNECTION_STRING')

  if (!connectionString) {
    console.error('❌ Error: AZURE_STORAGE_CONNECTION_STRING environment variable is required')
    console.log('')
    console.log('Set it in .env file or as environment variable:')
    console.log('  export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."')
    console.log('')
    Deno.exit(1)
  }

  // Create storage connector
  console.log('☁️  Connecting to Azure Blob Storage...')
  const storageConnector = createAzureStorageConnector(
    connectionString,
    'resources',
    {
      sasExpiryMinutes: 15,
      storageVersion: 'v1',
      imageFolder: 'images'
    }
  )

  // Read image file
  console.log(`📂 Reading image: ${options.imagePath}`)
  let fileData: Uint8Array
  try {
    fileData = await Deno.readFile(options.imagePath)
  } catch (error: any) {
    console.error(`❌ Error reading file: ${error.message}`)
    Deno.exit(1)
  }

  const buffer = Buffer.from(fileData)

  console.log(`📊 Original file size: ${(buffer.length / 1024).toFixed(2)} KB`)

  // Create metadata
  const metadata = createImageMetadata(options.imageType, options.ownerId, options.entityId)
  const blobMetadata: Record<string, string> = {
    imageType: metadata.imageType,
    ownerId: metadata.ownerId,
    entityId: metadata.entityId,
    uploadedAt: metadata.uploadedAt,
  }

  // Check if we need to generate preview (spots always get preview)
  const shouldGeneratePreview = options.imageType === 'spot'

  // Upload to storage
  console.log('☁️  Uploading to Azure Blob Storage...')

  let previewBlobPath: string | undefined
  let blobPath: string
  let processedBuffer: Buffer

  if (shouldGeneratePreview) {
    console.log('🔄 Processing image (resize + compress + blur preview)...')

    // Convert buffer to base64 data URL
    const base64 = `data:image/${detectExtension(options.imagePath)};base64,${buffer.toString('base64')}`

    // Process image to create optimized original + blurred preview
    const processed = await processImage(base64, { blur: true })

    // Generate blob paths (only image ID, StorageConnector adds v1/images/ prefix)
    blobPath = options.customId
      ? `${options.customId}.${processed.extension}`
      : generateImageId(processed.extension)
    previewBlobPath = getBlurredPath(blobPath)

    console.log(`📦 Compressed: ${(buffer.length / 1024).toFixed(2)} KB → ${(processed.original.length / 1024).toFixed(2)} KB`)

    // Upload original and preview separately
    await storageConnector.uploadFile(blobPath, processed.original, blobMetadata)

    if (processed.blurred) {
      const previewMetadata = { ...blobMetadata, type: 'preview' }
      await storageConnector.uploadFile(previewBlobPath, processed.blurred, previewMetadata)
    }

    console.log(`✅ Uploaded original and preview`)
  } else {
    console.log('🔄 Processing image (resize + compress)...')

    // Convert buffer to base64 data URL
    const base64 = `data:image/${detectExtension(options.imagePath)};base64,${buffer.toString('base64')}`

    // Process image to create optimized version
    const processed = await processImage(base64)

    // Generate blob path (only image ID, StorageConnector adds v1/images/ prefix)
    blobPath = options.customId
      ? `${options.customId}.${processed.extension}`
      : generateImageId(processed.extension)

    console.log(`📦 Compressed: ${(buffer.length / 1024).toFixed(2)} KB → ${(processed.original.length / 1024).toFixed(2)} KB`)

    await storageConnector.uploadFile(blobPath, processed.original, blobMetadata)
    console.log(`✅ Uploaded`)
  }

  // Get URLs
  const item = await storageConnector.getItemUrl(blobPath)

  if (!item) {
    console.error(`❌ Failed to get URL for uploaded blob: ${blobPath}`)
    Deno.exit(1)
  }

  console.log('---')
  console.log('✅ Upload successful!')
  console.log('')
  console.log('📋 Details:')
  console.log(`   Blob Path:  ${blobPath}`)
  if (previewBlobPath) {
    console.log(`   Preview:    ${previewBlobPath}`)
  }
  console.log(`   Image Type: ${options.imageType}`)
  console.log(`   Owner ID:   ${options.ownerId}`)
  console.log(`   Entity ID:  ${options.entityId}`)
  console.log('')
  console.log('🔗 SAS URL (15min expiry):')
  console.log(`   ${item.url}`)
  console.log('')
  console.log('💾 Use this blob path in your data:')
  if (previewBlobPath) {
    console.log(`   "imageBlobPath": "${blobPath}",`)
    console.log(`   "previewImageBlobPath": "${previewBlobPath}"`)
  } else {
    console.log(`   "imageBlobPath": "${blobPath}"`)
  }
  console.log('')
}

// Run
try {
  const options = parseArgs()
  await uploadImage(options)
} catch (error: any) {
  console.error('❌ Error:', error.message)
  Deno.exit(1)
}

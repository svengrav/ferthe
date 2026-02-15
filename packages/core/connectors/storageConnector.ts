import { BlobSASPermissions, BlobServiceClient, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { logger } from '@core/shared/logger.ts';
import { Buffer } from "node:buffer";

export interface StorageItem {
  id: string
  url: string
}

interface StorageConnectorOptions {
  /**
   * SAS token expiry time in minutes for read access.
   * Default: 15 minutes (more secure than long-lived tokens)
   */
  sasExpiryMinutes?: number
  /**
   * Storage structure version (e.g., 'v1')
   * Default: 'v1'
   */
  storageVersion?: string
  /**
   * Image folder name within the version namespace
   * Default: 'images'
   */
  imageFolder?: string
}

export interface StorageConnector {
  getItemUrl(key: string): Promise<StorageItem | null>
  uploadFile(path: string, data: Buffer | string, metadata?: Record<string, string>): Promise<string>
  uploadFileWithPreview(path: string, data: Buffer, previewData: Buffer, metadata?: Record<string, string>): Promise<{ url: string; previewUrl: string }>
  deleteFile(path: string): Promise<void>
  getMetadata(path: string): Promise<Record<string, string>>
}

const parseConnectionString = (connectionString: string): { accountName: string; accountKey: string } => {
  const params = connectionString.split(';').reduce((acc, param) => {
    const [key, value] = param.split('=')
    if (key && value) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, string>)

  return {
    accountName: params.AccountName || '',
    accountKey: params.AccountKey || '',
  }
}

export const createAzureStorageConnector = (
  connectionString: string,
  containerName: string,
  options: StorageConnectorOptions = {}
): StorageConnector => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  const connectionParams = parseConnectionString(connectionString)
  const { accountName, accountKey } = connectionParams
  const sasExpiryMinutes = options.sasExpiryMinutes ?? 15 // Default: 15 minutes
  const storageVersion = options.storageVersion ?? 'v1'
  const imageFolder = options.imageFolder ?? 'images'

  const getContainerClient = async () => {
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const exists = await containerClient.exists()
    !exists && await containerClient.create()
    return containerClient
  }

  // Build full blob path from key
  const buildFullPath = (key: string): string => {
    // If key already contains version prefix, use as-is (backward compatibility)
    return key.startsWith(`${storageVersion}/`)
      ? key
      : `${storageVersion}/${imageFolder}/${key}`
  }

  const getBlobClient = async (key: string) => {
    const containerClient = await getContainerClient()
    const fullPath = buildFullPath(key)
    return containerClient.getBlobClient(fullPath)
  }

  const getItemUrl = async (key: string): Promise<StorageItem | null> => {
    try {
      const blobClient = await getBlobClient(key)
      const exists = await blobClient.exists()

      if (!exists) {
        logger.warn(`Storage item not found: ${key}`)
        return null
      }

      // Generate SAS token
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
      const fullPath = buildFullPath(key)
      const sasOptions = {
        containerName: containerName,
        blobName: fullPath,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + sasExpiryMinutes * 60 * 1000),
      }
      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString()
      const urlWithSAS = `${blobClient.url}?${sasToken}`

      return {
        id: key,
        url: urlWithSAS,
      }
    } catch (error) {
      logger.error('Error getting storage item', { key, error })
      throw error
    }
  }

  const uploadFile = async (path: string, data: Buffer | string, metadata?: Record<string, string>): Promise<string> => {
    try {
      const blobClient = await getBlobClient(path)
      const blockBlobClient = blobClient.getBlockBlobClient()

      // Upload blob with metadata
      await blockBlobClient.upload(data, Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data))

      // Set metadata if provided
      if (metadata) {
        await blobClient.setMetadata(metadata)
      }

      // Generate SAS URL for the uploaded file
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
      const fullPath = buildFullPath(path)
      const sasOptions = {
        containerName: containerName,
        blobName: fullPath,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + sasExpiryMinutes * 60 * 1000),
      }
      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString()
      const urlWithSAS = `${blobClient.url}?${sasToken}`

      return urlWithSAS
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const deleteFile = async (path: string): Promise<void> => {
    try {
      const blobClient = await getBlobClient(path)

      const exists = await blobClient.exists()
      if (!exists) {
        throw new Error(`Blob not found: ${path}`)
      }

      await blobClient.delete()
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  const uploadFileWithPreview = async (
    path: string,
    data: Buffer,
    previewData: Buffer,
    metadata?: Record<string, string>
  ): Promise<{ url: string; previewUrl: string }> => {
    try {
      // Upload original
      const originalUrl = await uploadFile(path, data, metadata)

      // Generate preview path
      const lastDot = path.lastIndexOf('.')
      const previewPath = lastDot === -1
        ? `${path}-blurred`
        : `${path.substring(0, lastDot)}-blurred${path.substring(lastDot)}`

      // Upload preview
      const previewUrl = await uploadFile(previewPath, previewData, { ...metadata, type: 'preview' })

      return {
        url: originalUrl,
        previewUrl,
      }
    } catch (error) {
      console.error('Error uploading file with preview:', error)
      throw error
    }
  }

  const getMetadata = async (path: string): Promise<Record<string, string>> => {
    try {
      const blobClient = await getBlobClient(path)

      const properties = await blobClient.getProperties()
      return properties.metadata || {}
    } catch (error) {
      console.error('Error getting metadata:', error)
      throw error
    }
  }

  return {
    getItemUrl,
    uploadFile,
    uploadFileWithPreview,
    deleteFile,
    getMetadata,
  }
}

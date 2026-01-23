import { BlobSASPermissions, BlobServiceClient, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { Buffer } from "node:buffer";

interface StorageItem {
  id: string
  url: string
}

interface StorageConnector {
  getItemUrl(key: string): Promise<StorageItem>
  uploadFile(path: string, data: Buffer | string, contentType?: string): Promise<string>
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

export const createAzureStorageConnector = (connectionString: string, containerName: string): StorageConnector => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  const connectionParams = parseConnectionString(connectionString)
  const { accountName, accountKey } = connectionParams

  const getItemUrl = async (key: string): Promise<StorageItem> => {
    try {
      const blobClient = blobServiceClient.getContainerClient(containerName).getBlobClient(key)
      const exists = await blobClient.exists()

      if (!exists) {
        throw new Error(`Item with key ${key} not found`)
      }

      // Generate SAS token
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
      const sasOptions = {
        containerName: containerName,
        blobName: key,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      }
      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString()
      const urlWithSAS = `${blobClient.url}?${sasToken}`

      return {
        id: key,
        url: urlWithSAS,
      }
    } catch (error) {
      console.error('Error getting item:', error)
      throw error
    }
  }

  const uploadFile = async (path: string, data: Buffer | string): Promise<string> => {
    try {
      const containerClient = blobServiceClient.getContainerClient(containerName)
      const blobClient = containerClient.getBlobClient(path)

      await blobClient.getBlockBlobClient().upload(data, Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data))

      // Generate SAS URL for the uploaded file
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
      const sasOptions = {
        containerName: containerName,
        blobName: path,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString()
      const urlWithSAS = `${blobClient.url}?${sasToken}`

      return urlWithSAS
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  return {
    getItemUrl,
    uploadFile,
  }
}

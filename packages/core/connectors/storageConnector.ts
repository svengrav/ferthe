import { BlobSASPermissions, BlobServiceClient, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob'
import console from 'console'
interface StorageItem {
  id: string
  url: string
}

interface StorageConnector {
  getItemUrl(key: string): Promise<StorageItem>
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

  return {
    getItemUrl,
  }
}

import { logger } from '@app/shared/utils/logger'
import { useState } from 'react'
import { Platform } from 'react-native'

interface UseImageUploadResult {
  convertImageToBase64: (imageUri: string) => Promise<string>
  isConverting: boolean
  error: string | null
}

/**
 * Hook to convert image URI to Base64 for API upload
 * Platform-specific implementation for native and web
 */
export const useImageUpload = (): UseImageUploadResult => {
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      setIsConverting(true)
      setError(null)

      // Web platform: use FileReader API
      if (Platform.OS === 'web') {
        return await convertWebImageToBase64(imageUri)
      }

      // Native platforms: use expo-file-system
      const FileSystemModule = await import('expo-file-system/legacy')
      const base64 = await FileSystemModule.readAsStringAsync(imageUri, {
        encoding: FileSystemModule.EncodingType.Base64,
      })
      return base64
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert image'
      setError(errorMessage)
      logger.error('Error converting image to base64:', err)
      throw err
    } finally {
      setIsConverting(false)
    }
  }

  return {
    convertImageToBase64,
    isConverting,
    error,
  }
}

/**
 * Helper function to convert web-based image to base64
 * Handles both Blob/File objects and data URLs
 */
const convertWebImageToBase64 = async (imageData: string | Blob): Promise<string> => {
  if (typeof imageData === 'string') {
    // If it's already a data URL
    if (imageData.startsWith('data:')) {
      return imageData.split(',')[1]
    }

    // If it's a blob URL (from input type="file")
    const response = await fetch(imageData)
    const blob = await response.blob()
    return blobToBase64(blob)
  }

  // If it's a Blob/File object
  return blobToBase64(imageData)
}

/**
 * Convert Blob to Base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      resolve(base64.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

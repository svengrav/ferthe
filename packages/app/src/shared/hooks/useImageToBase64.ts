import { logger } from '@app/shared/utils/logger'
import { File } from 'expo-file-system'
import { useState } from 'react'
import { Platform } from 'react-native'

interface UseImageToBase64Result {
  convertToBase64: (imageUri: string) => Promise<string>
  isConverting: boolean
  error: string | null
}

/**
 * Hook to convert image URI to Base64 data URL
 * Returns complete data URL: data:image/jpeg;base64,{base64}
 * 
 * Platform-specific implementation:
 * - Native: expo-file-system File API
 * - Web: fetch + FileReader
 */
export const useImageToBase64 = (): UseImageToBase64Result => {
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convertToBase64 = async (imageUri: string): Promise<string> => {
    try {
      setIsConverting(true)
      setError(null)

      let base64: string

      if (Platform.OS === 'web') {
        // Web: use fetch + FileReader
        const response = await fetch(imageUri)
        const blob = await response.blob()
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result as string
            const base64Data = result.split(',')[1]
            resolve(base64Data)
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } else {
        // Native: use expo-file-system File API
        const file = new File(imageUri)
        base64 = await file.base64()
      }

      // Return complete data URL
      return `data:image/jpeg;base64,${base64}`
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
    convertToBase64,
    isConverting,
    error,
  }
}

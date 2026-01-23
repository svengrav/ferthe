import { logger } from '@app/shared/utils/logger'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { Platform } from 'react-native'

interface UseImagePickerResult {
  selectedImageUri: string | null
  pickImage: () => Promise<void>
  clearImage: () => void
  isLoading: boolean
}

/**
 * Hook to pick images from device gallery/camera roll
 * Native only - returns URI that can be read as base64
 */
export const useImagePicker = (): UseImagePickerResult => {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const pickImage = async () => {
    // Image picker not supported on web
    if (Platform.OS === 'web') {
      logger.warn('Image picker is only available on native platforms')
      return
    }

    try {
      setIsLoading(true)

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        logger.warn('Permission to access media library was denied')
        setIsLoading(false)
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'livePhotos'],
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        setSelectedImageUri(asset.uri)
      }
    } catch (error) {
      logger.error('Error picking image:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearImage = () => {
    setSelectedImageUri(null)
  }

  return {
    selectedImageUri,
    pickImage,
    clearImage,
    isLoading,
  }
}

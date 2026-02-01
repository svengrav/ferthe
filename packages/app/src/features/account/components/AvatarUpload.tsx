import { getAppContext } from '@app/appContext'
import { Button, Card, Icon, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { useAccountData } from '../stores/accountStore'

interface AvatarUploadProps {
  onSubmit: () => void
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ onSubmit }) => {
  const theme = useThemeStore()
  const { t } = useLocalizationStore()
  const { account } = useAccountData()
  const { accountApplication } = getAppContext()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const styles = createStyles(theme)

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissionResult.granted) {
      logger.error('Permission to access camera roll is required')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri)
    }
  }

  const handleUpload = async () => {
    if (!selectedImageUri) return

    setIsUploading(true)
    try {
      // Read image as base64 using fetch and FileReader
      const response = await fetch(selectedImageUri)
      const blob = await response.blob()
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          // Remove data URL prefix to get pure base64
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      // Upload via accountApplication
      const uploadResult = await accountApplication.uploadAvatar(`data:image/jpeg;base64,${base64Data}`)

      if (uploadResult.success) {
        logger.log('Avatar uploaded successfully')
        onSubmit()
      } else {
        logger.error('Failed to upload avatar:', uploadResult.error)
      }
    } catch (error) {
      logger.error('Error uploading avatar:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const currentAvatar = selectedImageUri || account?.avatarUrl

  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        <Pressable onPress={pickImage} style={styles.avatarContainer}>
          {currentAvatar ? (
            <Image source={{ uri: currentAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Icon name="person" size={48} color={theme.colors.onSurface} />
            </View>
          )}
        </Pressable>

        <Text variant="hint" style={styles.hint}>
          Tap to select image
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            label="Select Image"
            onPress={pickImage}
            variant="outlined"
            disabled={isUploading}
          />
          {selectedImageUri && (
            <Button
              label="Save"
              onPress={handleUpload}
              variant="primary"
              disabled={isUploading}
            />
          )}
        </View>
      </View>
    </Card>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      width: '100%',
    },
    container: {
      alignItems: 'center',
      gap: 16,
    },
    avatarContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    placeholderAvatar: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    hint: {
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
  })

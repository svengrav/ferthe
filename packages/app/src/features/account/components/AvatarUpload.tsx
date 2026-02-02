import { getAppContext } from '@app/appContext'
import { Button, Card, Icon, Text } from '@app/shared/components'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
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
  const { selectedImageUri, pickImage, isLoading: isPickingImage } = useImagePicker()
  const { convertToBase64, isConverting } = useImageToBase64()
  const [isUploading, setIsUploading] = useState(false)
  const styles = createStyles(theme)

  const handleUpload = async () => {
    if (!selectedImageUri) return

    setIsUploading(true)
    try {
      const base64DataUrl = await convertToBase64(selectedImageUri)
      const uploadResult = await accountApplication.uploadAvatar(base64DataUrl)

      if (uploadResult.success && uploadResult.data) {
        logger.log('Avatar uploaded successfully:', uploadResult.data.avatarUrl)
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

  const isLoading = isPickingImage || isConverting || isUploading
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
            disabled={isLoading}
          />
          {selectedImageUri && (
            <Button
              label="Save"
              onPress={handleUpload}
              variant="primary"
              disabled={isLoading}
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

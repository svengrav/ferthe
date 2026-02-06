import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { getAppContext } from '@app/appContext'
import { Avatar, Button, Card } from '@app/shared/components'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'

import { useAccountData } from '../stores/accountStore'

interface AvatarUploadProps {
  onSubmit: () => void
}

/**
 * Component for uploading and updating user avatar.
 * Allows user to select an image and upload it as their profile avatar.
 */
function AvatarUpload(props: AvatarUploadProps) {
  const { onSubmit } = props

  const { styles } = useTheme(createStyles)
  const { t } = useLocalizationStore()
  const { account } = useAccountData()
  const { accountApplication } = getAppContext()
  const { selectedImageUri, pickImage, isLoading: isPickingImage } = useImagePicker()
  const { convertToBase64, isConverting } = useImageToBase64()
  const [isUploading, setIsUploading] = useState(false)

  // Determine current avatar to display
  const currentAvatar = selectedImageUri || account?.avatar?.url
  const isLoading = isPickingImage || isConverting || isUploading

  // Upload selected avatar image
  const handleUpload = async () => {
    if (!selectedImageUri) return

    setIsUploading(true)
    try {
      const base64DataUrl = await convertToBase64(selectedImageUri)
      const uploadResult = await accountApplication.uploadAvatar(base64DataUrl)

      if (uploadResult.success && uploadResult.data) {
        logger.log('Avatar uploaded successfully:', uploadResult.data.avatar?.url)
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

  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        <Avatar
          avatarUrl={currentAvatar}
          size={100}
          onPress={pickImage}
        />

        <View style={styles.buttonContainer}>
          <Button
            label={t.account.selectImage}
            onPress={pickImage}
            variant="outlined"
            disabled={isLoading}
          />
          {selectedImageUri && (
            <Button
              label={t.account.save}
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
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
  })

export default AvatarUpload

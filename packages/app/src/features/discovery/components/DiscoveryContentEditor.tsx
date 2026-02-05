import { Button, TextInput } from '@app/shared/components'
import Field from '@app/shared/components/field/Field'
import Text from '@app/shared/components/text/Text'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'
import { DiscoveryContent } from '@shared/contracts'
import { useState } from 'react'
import { Image, View } from 'react-native'

interface DiscoveryContentEditorProps {
  existingContent?: DiscoveryContent
  onSubmit: (data: { imageUrl?: string; comment?: string }) => void
  onCancel: () => void
  isLoading?: boolean
}

/**
 * Form to add or edit discovery content (device photo + comment) in overlay mode.
 * Only supports image upload from device, not URL input.
 */
function DiscoveryContentEditor({
  existingContent,
  onSubmit,
  onCancel,
  isLoading = false,
}: DiscoveryContentEditorProps) {
  const { styles } = useApp(useStyles)
  const { t } = useLocalizationStore()
  const { selectedImageUri, pickImage, clearImage, isLoading: isPickingImage } = useImagePicker()
  const { convertToBase64, isConverting } = useImageToBase64()

  const [comment, setComment] = useState(existingContent?.comment ?? '')
  const [hasExistingImage, setHasExistingImage] = useState(!!existingContent?.image)

  const handleSubmit = async () => {
    try {
      let imageDataToSubmit: string | undefined

      if (selectedImageUri) {
        imageDataToSubmit = await convertToBase64(selectedImageUri)
      } else if (hasExistingImage) {
        imageDataToSubmit = existingContent?.image?.url
      }

      onSubmit({
        imageUrl: imageDataToSubmit,
        comment: comment.trim() || undefined,
      })
      clearImage()
    } catch (error) {
      logger.error('Error submitting content:', error)
    }
  }

  const handleDeleteImage = () => {
    clearImage()
    setHasExistingImage(false)
  }

  const displayImageUrl = selectedImageUri || (hasExistingImage ? existingContent?.image?.url : undefined)
  const isEditing = !!existingContent
  const commentChanged = comment !== (existingContent?.comment ?? '')
  const imageChanged = selectedImageUri || !hasExistingImage

  if (!styles) return null

  const renderImageSection = () => {
    if (!displayImageUrl) return null

    return (
      <View style={styles.imagePreviewContainer}>
        <Image
          source={{ uri: displayImageUrl }}
          style={styles.imagePreview}
          resizeMode="cover"
        />
        <View style={styles.imageActions}>
          <Button
            icon="delete"
            variant="outlined"
            onPress={handleDeleteImage}
            disabled={isLoading || isConverting}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text variant="label" style={styles.label}>
        {isEditing ? t.discovery.editYourDiscovery : t.discovery.documentYourDiscovery}
      </Text>

      {renderImageSection()}

      <Button
        label={isPickingImage ? t.discovery.pickingImage : t.discovery.pickImageFromDevice}
        variant="outlined"
        onPress={pickImage}
        disabled={isLoading || isPickingImage}
      />

      <Field helperText={t.discovery.shareYourStory}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={t.discovery.shareYourStoryPlaceholder}
          multiline
          numberOfLines={4}
          editable={!isLoading && !isConverting}
        />
      </Field>
      <View style={styles.buttonRow}>
        <Button
          label={t.discovery.cancel}
          variant="outlined"
          onPress={onCancel}
          disabled={isLoading || isConverting}
        />
        <Button
          label={isConverting ? t.discovery.processing : isLoading ? t.discovery.saving : isEditing ? t.discovery.update : t.discovery.save}
          variant="primary"
          onPress={handleSubmit}
          disabled={isLoading || isConverting || (!commentChanged && !imageChanged && isEditing)}
        />
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    gap: 12,
    padding: 16,
  },
  label: {
    marginBottom: 8,
  },
  imagePreviewContainer: {
    gap: 8,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
}))

export default DiscoveryContentEditor

import { Button, IconButton, TextInput } from '@app/shared/components'
import Text from '@app/shared/components/text/Text'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
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
          <IconButton
            name="delete"
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
        {isEditing ? 'Edit your discovery' : 'Document your discovery'}
      </Text>

      {renderImageSection()}

      <Button
        label={isPickingImage ? 'Picking image...' : 'Pick Image from Device'}
        variant="outlined"
        onPress={pickImage}
        disabled={isLoading || isPickingImage}
      />

      <TextInput
        label="Comment (optional)"
        value={comment}
        onChangeText={setComment}
        placeholder="Share your thoughts about this discovery..."
        multiline
        numberOfLines={4}
        editable={!isLoading && !isConverting}
      />

      <View style={styles.buttonRow}>
        <Button
          label="Cancel"
          variant="outlined"
          onPress={onCancel}
          disabled={isLoading || isConverting}
        />
        <Button
          label={isConverting ? 'Processing...' : isLoading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
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

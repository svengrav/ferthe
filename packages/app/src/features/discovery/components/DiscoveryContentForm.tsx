import { Button, TextInput } from '@app/shared/components'
import Text from '@app/shared/components/text/Text'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useImageUpload } from '@app/shared/hooks/useImageUpload'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'
import { DiscoveryContent } from '@shared/contracts'
import { useState } from 'react'
import { Image, View } from 'react-native'

interface DiscoveryContentFormProps {
  existingContent?: DiscoveryContent
  onSubmit: (content: { imageUrl?: string; comment?: string }) => void
  onCancel?: () => void
  isLoading?: boolean
}

/**
 * Form to add or edit discovery content (image URL + comment)
 */
const DiscoveryContentForm = ({
  existingContent,
  onSubmit,
  onCancel,
  isLoading = false,
}: DiscoveryContentFormProps) => {
  const { styles } = useApp(useStyles)
  const { selectedImageUri, pickImage, clearImage, isLoading: isPickingImage } = useImagePicker()
  const { convertImageToBase64, isConverting } = useImageUpload()

  const [imageUrl, setImageUrl] = useState(existingContent?.imageUrl ?? '')
  const [comment, setComment] = useState(existingContent?.comment ?? '')

  const handleSubmit = async () => {
    try {
      let imageDataToSubmit = selectedImageUri || imageUrl

      if (selectedImageUri) {
        const base64 = await convertImageToBase64(selectedImageUri)
        imageDataToSubmit = `data:image/jpeg;base64,${base64}`
      }

      onSubmit({
        imageUrl: imageDataToSubmit || undefined,
        comment: comment.trim() || undefined,
      })
      clearImage()
    } catch (error) {
      logger.error('Error submitting content:', error)
    }
  }

  const displayImageUrl = selectedImageUri || imageUrl
  const isEditing = !!existingContent
  const hasChanges = imageUrl !== (existingContent?.imageUrl ?? '') ||
    comment !== (existingContent?.comment ?? '')

  if (!styles) return null

  return (
    <View style={styles.container}>
      <Text variant="label" style={styles.label}>
        {isEditing ? 'Edit your discovery' : 'Document your discovery'}
      </Text>
      { Boolean(displayImageUrl) && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: displayImageUrl }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
          <Button
            label="Remove"
            variant="outlined"
            onPress={() => {
              setImageUrl('')
              clearImage()
            }}
            disabled={isLoading}
          />
        </View>
      )}
      <TextInput
        label="Image URL (optional)"
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://..."
        autoCapitalize="none"
        keyboardType="url"
      />

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
        {onCancel && (
          <Button
            label="Cancel"
            variant="outlined"
            onPress={onCancel}
            disabled={isLoading || isConverting}
          />
        )}
        <Button
          label={isConverting ? 'Processing...' : isLoading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          variant="primary"
          onPress={handleSubmit}
          disabled={isLoading || isConverting || (!hasChanges && isEditing && !selectedImageUri)}
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
}))

export default DiscoveryContentForm

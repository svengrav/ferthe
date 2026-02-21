import { Button, TextInput } from '@app/shared/components'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import Field from '@app/shared/components/field/Field'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { useLocalization } from '@app/shared/localization'
import { OverlayCard, closeOverlay, setOverlay } from '@app/shared/overlay'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { DiscoveryContent } from '@shared/contracts'
import { useState } from 'react'
import { Image, View } from 'react-native'

/**
 * Hook to open/close the discovery content editor card.
 */
export function useDiscoveryContentEditorCard() {
  return {
    showDiscoveryContentEditorCard: (
      id: string,
      content: DiscoveryContent | undefined,
      onSubmit: (data: { imageUrl?: string; comment?: string }) => Promise<void>
    ) => {
      const cardId = 'discovery-content-editor-card-' + id
      return setOverlay(
        cardId,
        <DiscoveryContentEditorCard
          existingContent={content}
          onSubmit={onSubmit}
          onClose={() => closeOverlay(cardId)}
        />,
      )
    },
    closeDiscoveryContentEditorCard: (id: string) => closeOverlay('discovery-content-editor-card-' + id)
  }
}

interface DiscoveryContentEditorCardProps {
  existingContent?: DiscoveryContent
  onSubmit: (data: { imageUrl?: string; comment?: string }) => Promise<void>
  onClose: () => void
}

/**
 * Card wrapper for discovery content editor.
 * Form to add or edit discovery content (device photo + comment) in overlay mode.
 */
function DiscoveryContentEditorCard(props: DiscoveryContentEditorCardProps) {
  const { existingContent, onSubmit, onClose } = props
  const { styles } = useTheme(useStyles)
  const { locales } = useLocalization()
  const { selectedImageUri, pickImage, clearImage, isLoading: isPickingImage } = useImagePicker()
  const { convertToBase64, isConverting } = useImageToBase64()

  const [comment, setComment] = useState(existingContent?.comment ?? '')
  const [hasExistingImage, setHasExistingImage] = useState(!!existingContent?.image)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { closeDialog, openDialog } = useRemoveDialog()
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      let imageDataToSubmit: string | undefined

      if (selectedImageUri) {
        imageDataToSubmit = await convertToBase64(selectedImageUri)
      } else if (hasExistingImage) {
        imageDataToSubmit = existingContent?.image?.url
      }

      await onSubmit({
        imageUrl: imageDataToSubmit,
        comment: comment.trim() || undefined,
      })
      clearImage()
    } catch (error) {
      logger.error('Error submitting content:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteImage = () => {
    openDialog({
      onConfirm: () => {
        clearImage()
        setHasExistingImage(false)
      }
    })
  }

  const displayImageUrl = selectedImageUri || (hasExistingImage ? existingContent?.image?.url : undefined)
  const isEditing = !!existingContent
  const commentChanged = comment !== (existingContent?.comment ?? '')
  const imageChanged = selectedImageUri || !hasExistingImage
  const isLoading = isSubmitting || isConverting

  if (!styles) return null

  const title = isEditing ? locales.discovery.editYourDiscovery : locales.discovery.documentYourDiscovery

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
            disabled={isLoading}
          />
        </View>
      </View>
    )
  }

  return (
    <OverlayCard title={title} onClose={onClose}>
      <View style={styles.container}>
        {renderImageSection()}

        <Button
          label={isPickingImage ? locales.discovery.pickingImage : locales.discovery.pickImageFromDevice}
          variant="outlined"
          onPress={pickImage}
          disabled={isLoading || isPickingImage}
        />

        <Field helperText={locales.discovery.shareYourStory}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={locales.discovery.shareYourStoryPlaceholder}
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />
        </Field>
        <View style={styles.buttonRow}>
          <Button
            label={locales.discovery.cancel}
            variant="outlined"
            onPress={onClose}
            disabled={isLoading}
          />
          <Button
            label={isConverting ? locales.discovery.processing : isSubmitting ? locales.discovery.saving : isEditing ? locales.discovery.update : locales.discovery.save}
            variant="primary"
            onPress={handleSubmit}
            disabled={isLoading || (!commentChanged && !imageChanged && isEditing)}
          />
        </View>
      </View>
    </OverlayCard>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    gap: 12,
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
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
}))

export default DiscoveryContentEditorCard

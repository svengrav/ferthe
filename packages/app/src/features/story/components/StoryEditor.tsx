import { Button, showSnackbar, TextInput } from '@app/shared/components'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import Field from '@app/shared/components/field/Field'
import Picker from '@app/shared/components/picker/Picker'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { useLocalization } from '@app/shared/localization'
import { closeOverlay, OverlayCard, setOverlay } from '@app/shared/overlay'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { Story, StoryVisibility, UpsertStoryRequest } from '@shared/contracts'
import { useState } from 'react'
import { Image, View } from 'react-native'

export function useStoryEditor() {
  return {
    showStoryEditor: (
      contextId: string,
      story: Story | undefined,
      onSubmit: (data: UpsertStoryRequest) => Promise<void>,
    ) => {
      const cardId = 'story-editor-' + contextId
      return setOverlay(
        cardId,
        <StoryEditorCard
          existingStory={story}
          onSubmit={onSubmit}
          onClose={() => closeOverlay(cardId)}
        />,
      )
    },
    closeStoryEditor: (contextId: string) => closeOverlay('story-editor-' + contextId),
  }
}

interface StoryEditorCardProps {
  existingStory?: Story
  onSubmit: (data: UpsertStoryRequest) => Promise<void>
  onClose: () => void
}

function StoryEditorCard({ existingStory, onSubmit, onClose }: StoryEditorCardProps) {
  const { styles, theme } = useTheme(useStyles)
  const { locales } = useLocalization()
  const { selectedImageUri, pickImage, clearImage, isLoading: isPickingImage } = useImagePicker()
  const { convertToBase64, isConverting } = useImageToBase64()

  const [comment, setComment] = useState(existingStory?.comment ?? '')
  const [visibility, setVisibility] = useState<StoryVisibility>(existingStory?.visibility ?? 'private')
  const [hasExistingImage, setHasExistingImage] = useState(!!existingStory?.image)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { closeDialog, openDialog } = useRemoveDialog()

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      let imageDataToSubmit: string | undefined

      if (selectedImageUri) {
        imageDataToSubmit = await convertToBase64(selectedImageUri)
      } else if (hasExistingImage) {
        imageDataToSubmit = existingStory?.image?.url
      }

      const imageWasRemoved = !!existingStory?.image && !hasExistingImage && !selectedImageUri
      await onSubmit({
        imageUrl: imageDataToSubmit,
        removeImage: imageWasRemoved || undefined,
        comment: comment.trim() || undefined,
        visibility,
      })
      clearImage()
      showSnackbar(locales.spotCreation.created)
    } catch (error) {
      logger.error('Error submitting story:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteImage = () => {
    openDialog({
      onConfirm: () => {
        clearImage()
        setHasExistingImage(false)
      },
    })
  }

  const displayImageUrl = selectedImageUri || (hasExistingImage ? existingStory?.image?.url : undefined)
  const isEditing = !!existingStory
  const commentChanged = comment !== (existingStory?.comment ?? '')
  const visibilityChanged = visibility !== (existingStory?.visibility ?? 'private')
  const imageChanged = !!selectedImageUri || (!hasExistingImage && !!existingStory?.image)
  const isLoading = isSubmitting || isConverting

  if (!styles) return null

  const title = isEditing ? locales.discovery.editYourDiscovery : locales.discovery.documentYourDiscovery

  return (
    <OverlayCard title={title} onClose={onClose} keyboardAware={true}>
      <View style={styles.container}>
        {displayImageUrl && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: displayImageUrl }} style={styles.imagePreview} resizeMode="cover" />
            <View style={styles.imageActions}>
              <Button icon="delete" variant="outlined" onPress={handleDeleteImage} disabled={isLoading} />
            </View>
          </View>
        )}

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

        <Field helperText={locales.discovery.visibilityLabel}>
          <Picker
            options={[
              { icon: 'lock', value: 'private', label: locales.discovery.visibilityPrivate },
              { icon: 'public', value: 'public', label: locales.discovery.visibilityPublic },
            ]}
            selected={visibility}
            onValueChange={(value) => setVisibility(value as StoryVisibility)}
            variant="outlined"
          />
        </Field>

        <View style={styles.buttonRow}>
          <Button label={locales.discovery.cancel} variant="outlined" onPress={onClose} disabled={isLoading} />
          <Button
            label={isConverting ? locales.discovery.processing : isSubmitting ? locales.discovery.saving : isEditing ? locales.discovery.update : locales.discovery.save}
            variant="primary"
            onPress={handleSubmit}
            disabled={isLoading || (!commentChanged && !imageChanged && !visibilityChanged && isEditing)}
          />
        </View>
      </View>
    </OverlayCard>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: { gap: 12 },
  imagePreviewContainer: { gap: 8, alignItems: 'center' },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  imageActions: { flexDirection: 'row', gap: 8 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
}))

export default StoryEditorCard

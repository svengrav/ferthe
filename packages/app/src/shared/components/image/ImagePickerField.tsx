import { useEffect } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { Theme, useTheme } from '@app/shared/theme'
import Field from '../field/Field'
import PictureButtons from './PictureButtons'

interface ImagePickerFieldProps {
  /** Current image URI (local or remote) */
  value?: string
  /** Called when image is picked or removed */
  onChange: (uri?: string) => void
  /** Label when no image is selected */
  label?: string
  /** Label when image is already selected (defaults to label) */
  changeLabel?: string
  /** Image preview height */
  imageHeight?: number
}

/**
 * Image picker field with preview, change, and remove actions.
 * Wraps useImagePicker hook into a reusable form field.
 */
function ImagePickerField(props: ImagePickerFieldProps) {
  const {
    value,
    onChange,
    label,
    changeLabel,
    imageHeight = 200,
  } = props
  const { styles } = useTheme(createStyles)
  const { selectedImageUri, pickImage, takePhoto, clearImage } = useImagePicker()

  // Sync picked image into controlled value
  useEffect(() => {
    if (selectedImageUri && selectedImageUri !== value) {
      onChange(selectedImageUri)
    }
  }, [selectedImageUri])

  const displayImage = selectedImageUri || value

  return (
    <Field label={displayImage ? (changeLabel ?? label) : label}>
      {displayImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: displayImage }} style={[styles.image, { height: imageHeight }]} />
          <PictureButtons
            style={styles.imageActions}
            onGallery={pickImage}
            onCamera={takePhoto}
            onRemove={() => {
              clearImage()
              onChange(undefined)
            }}
          />
        </View>
      ) : (
        <PictureButtons
          style={styles.pickActions}
          onGallery={pickImage}
          onCamera={takePhoto}
        />
      )}
    </Field>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  imageContainer: {
    borderRadius: theme.tokens.borderRadius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    borderRadius: theme.tokens.borderRadius.md,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.tokens.spacing.sm,
  },
  pickActions: {
    flexDirection: 'row',
    gap: theme.tokens.spacing.sm,
  },
})

export default ImagePickerField

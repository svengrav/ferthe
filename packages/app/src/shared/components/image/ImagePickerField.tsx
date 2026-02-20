import { useEffect } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { Theme, useTheme } from '@app/shared/theme'
import Button from '../button/Button'
import Field from '../field/Field'

interface ImagePickerFieldProps {
  /** Current image URI (local or remote) */
  value?: string
  /** Called when image is picked or removed */
  onChange: (uri?: string) => void
  /** Label when no image is selected */
  label?: string
  /** Label when image is already selected (defaults to label) */
  changeLabel?: string
  /** Button text for initial pick action */
  pickButtonLabel?: string
  /** Button text for change action when image is shown */
  changeButtonLabel?: string
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
    pickButtonLabel,
    changeButtonLabel,
    imageHeight = 200,
  } = props
  const { styles } = useTheme(createStyles)
  const { selectedImageUri, pickImage, clearImage } = useImagePicker()

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
          <View style={styles.imageActions}>
            <Button
              label={changeButtonLabel ?? changeLabel}
              variant="outlined"
              size="sm"
              onPress={pickImage}
            />
            <Button
              icon="close"
              variant="outlined"
              size="sm"
              onPress={() => {
                clearImage()
                onChange(undefined)
              }}
            />
          </View>
        </View>
      ) : (
        <Button
          label={pickButtonLabel ?? label}
          icon="image"
          variant="outlined"
          onPress={pickImage}
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
})

export default ImagePickerField

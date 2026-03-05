import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button } from '@app/shared/components'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { ImageReference } from '@shared/contracts'

import { useLocalization } from '@app/shared/localization'
import SpotContainer from '../../card/components/SpotContainer'
import SpotGradientFrame from '../../card/components/SpotGradientFrame'
import SpotImage from '../../card/components/SpotImage'
import SpotTitle from '../../card/components/SpotTitle'
import { useSpotCardDimensions } from '../../card/hooks/useSpotCardDimensions'
import { Theme } from '@app/shared/theme/types'
import { useTheme } from '@app/shared/theme'

interface SpotCardPickerProps {
  name?: string
  imageUri?: string
  onChange: (value: string | undefined) => void
}

/**
 * Spot card with integrated image picker.
 * Reuses spot card building blocks to show a live preview
 * with add/change/remove photo controls.
 */
function SpotCardPicker({ name, imageUri, onChange }: SpotCardPickerProps) {
  const { locales } = useLocalization()
  const { styles } = useTheme(createStyles)
  const { selectedImageUri, pickImage } = useImagePicker()
  const { width, height } = useSpotCardDimensions({ variant: 'card' })

  const previewImage: ImageReference | undefined = imageUri
    ? { id: 'preview', url: imageUri }
    : undefined

  // Sync picked image into form field
  useEffect(() => {
    if (selectedImageUri) onChange(selectedImageUri)
  }, [selectedImageUri])

  return (
    <View style={styles.container}>
      <SpotContainer width={width} height={height} borderRadius={10} withShadow>
        <SpotGradientFrame padding={4}>
          <SpotTitle title={name} />
          {previewImage ? (
            <SpotImage source={previewImage} borderRadius={10} />
          ) : (
            <View style={styles.placeholder} />
          )}
          {!imageUri && (
            <View style={styles.overlay}>
              <Button
                icon="image"
                label={locales.spotCreation.addPhoto}
                variant="outlined"
                onPress={pickImage}
              />
            </View>
          )}
        </SpotGradientFrame>
      </SpotContainer>

      {imageUri && (
        <View style={styles.changePhotoRow}>
          <Button
            label={locales.spotCreation.changePhoto}
            variant="outlined"
            size="sm"
            onPress={pickImage}
          />
          <Button
            label={locales.common.delete}
            icon="close"
            variant="outlined"
            size="sm"
            onPress={() => onChange(undefined)}
          />
        </View>
      )}
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
  },
  placeholder: {
    flex: 1,
    borderRadius: theme.tokens.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoRow: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    flexDirection: 'row',
    gap: theme.tokens.spacing.sm,
  },
})

export default SpotCardPicker

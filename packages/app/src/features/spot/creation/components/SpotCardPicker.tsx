import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button } from '@app/shared/components'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useApp } from '@app/shared/useApp'
import { ImageReference } from '@shared/contracts'

import SpotContainer from '../../card/components/SpotContainer'
import SpotGradientFrame from '../../card/components/SpotGradientFrame'
import SpotImage from '../../card/components/SpotImage'
import SpotTitle from '../../card/components/SpotTitle'
import { useSpotCardDimensions } from '../../components'

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
  const { locales } = useApp()
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  placeholder: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(4, 2, 23, 0.603)',
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
    gap: 8,
  },
})

export default SpotCardPicker

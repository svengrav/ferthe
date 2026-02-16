import { Image } from '@app/shared/components'
import { ImageReference } from '@shared/contracts'
import { StyleSheet, View } from 'react-native'

interface SpotImageProps {
  source: ImageReference
  borderRadius?: number
}

/**
 * Basic spot image component for rendering a single image.
 * No overlay, no animations - just the image.
 * Always fills container (width/height: 100%).
 */
function SpotImage({ source, borderRadius = 0 }: SpotImageProps) {
  const imageStyle = {
    width: '100%' as const,
    height: '100%' as const,
    borderRadius,
  }

  return (
    <View style={[styles.container, imageStyle]}>
      <Image
        source={source}
        style={imageStyle}
        resizeMode="cover"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
})

export default SpotImage

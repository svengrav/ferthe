import { Image } from '@app/shared/components'
import { ImageReference } from '@shared/contracts'
import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'

const FADE_IN_DELAY = 2000
const ANIMATION_DURATION = 600

interface SpotBlurredImageProps {
  source: ImageReference
  blurredSource?: ImageReference
  borderRadius?: number
  revealed?: boolean
  onReveal?: () => void
}

/**
 * Spot image with blur-to-clear reveal animation.
 * Shows blurred image initially, then reveals clear image on trigger.
 * Always fills container (width/height: 100%).
 */
function SpotBlurredImage({
  source,
  blurredSource,
  borderRadius = 0,
  revealed = false,
  onReveal,
}: SpotBlurredImageProps) {
  const opacity = useSharedValue(revealed ? 0 : 1)

  useEffect(() => {
    if (revealed) {
      opacity.value = withDelay(FADE_IN_DELAY, withTiming(0, { duration: ANIMATION_DURATION }))
    }
  }, [revealed, opacity])

  const blurredStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const imageStyle = {
    width: '100%' as const,
    height: '100%' as const,
    borderRadius,
  }

  return (
    <Pressable onPress={onReveal} disabled={!onReveal || revealed}>
      <View style={[styles.container, imageStyle]}>
        {/* Clear image (base layer) */}
        <Image
          source={source}
          style={[styles.image, imageStyle]}
          resizeMode="cover"
        />

        {/* Blurred overlay (fades out on reveal) */}
        {blurredSource && (
          <Animated.View style={[styles.blurredOverlay, imageStyle, blurredStyle]}>
            <Image
              source={blurredSource}
              style={imageStyle}
              resizeMode="cover"
            />
          </Animated.View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    position: 'relative',
  },
  blurredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
})

export default SpotBlurredImage

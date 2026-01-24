import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { ReactNode, useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  runOnJS,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'

const FADE_IN_DELAY = 2000
const FADE_OUT_DELAY = 1000
const ANIMATION_DURATION = 1500
const TAP_CIRCLE_SIZE = 80
const TAP_ICON_SIZE = 40

/**
 * Hook to handle reveal overlay animations
 */
const useRevealAnimations = (onRevealComplete: () => void) => {
  const fadeOut = useSharedValue(1)
  const tapScale = useSharedValue(1)

  useEffect(() => {
    // Start continuous pulsing animation for tap icon
    const pulse = () => {
      tapScale.value = withTiming(1.3, { duration: 1200 }, () => {
        tapScale.value = withTiming(1, { duration: 1200 }, () => {
          pulse()
        })
      })
    }
    pulse()
  }, [tapScale])

  const triggerReveal = () => {
    fadeOut.value = withDelay(
      FADE_OUT_DELAY,
      withTiming(0, { duration: ANIMATION_DURATION }, () => {
        runOnJS(onRevealComplete)()
      })
    )
  }

  return { fadeOut, tapScale, triggerReveal }
}

interface DiscoveryRevealOverlayProps {
  mode: 'reveal' | 'instant'
  imageHeight: number
  imageWidth: number
  blurredImageUrl: string
  onTriggerReveal: () => void
  children: ReactNode
}

/**
 * Reveal overlay wrapper component
 * Wraps children and shows blur-to-clear reveal animation in reveal mode
 * In instant mode, shows children immediately without overlay
 */
export const DiscoveryRevealOverlay = ({
  mode,
  imageHeight,
  imageWidth,
  blurredImageUrl,
  onTriggerReveal,
  children
}: DiscoveryRevealOverlayProps) => {
  const { styles } = useApp(useStyles)
  const [isRevealed, setIsRevealed] = useState(mode === 'instant')

  const handleRevealComplete = () => {
    setIsRevealed(true)
  }

  const { fadeOut, tapScale, triggerReveal } = useRevealAnimations(handleRevealComplete)

  if (!styles) return null

  // In instant mode or after reveal: render children only
  if (isRevealed) {
    return <>{children}</>
  }

  const blurredOverlayStyles = {
    height: imageHeight,
    width: imageWidth,
  }

  const imageStyles = {
    width: imageWidth,
    height: imageHeight,
  }

  const handlePress = () => {
    triggerReveal()
    onTriggerReveal()
  }

  return (
    <>
      {children}
      <Animated.View
        style={[
          styles.blurredOverlay,
          blurredOverlayStyles,
          {
            opacity: fadeOut
          }
        ]}
      >
        <Pressable
          style={[styles.preview, { flex: 1 }]}
          onPress={handlePress}
        >
          {/* Animated tap icon */}
          <Animated.View style={[styles.tapCircle, { transform: [{ scale: tapScale }] }]}>
            <View style={styles.tapIconInner} />
          </Animated.View>

          {/* Discovery message below tap icon */}
          <Text style={styles.previewText}>
            You discovered a new spot!
          </Text>
        </Pressable>

        <Animated.Image
          source={{ uri: blurredImageUrl }}
          style={[styles.image, imageStyles]}
          resizeMode='cover'
        />
      </Animated.View>
    </>
  )
}

const useStyles = createThemedStyles(theme => ({
  blurredOverlay: {
    padding: 8,
    position: 'absolute',
  },
  preview: {
    position: 'absolute',
    flex: 1,
    zIndex: 2,
    height: '100%',
    width: '100%',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapCircle: {
    width: TAP_CIRCLE_SIZE,
    height: TAP_CIRCLE_SIZE,
    borderRadius: TAP_CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tapIconInner: {
    width: TAP_ICON_SIZE,
    height: TAP_ICON_SIZE,
    borderRadius: TAP_ICON_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.91)',
  },
  previewText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  image: {
    borderRadius: 14,
    opacity: 1,
  },
}))

import { ReactNode, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

const FADE_IN_DELAY = 2000
const FADE_OUT_DELAY = 1000
const ANIMATION_DURATION = 1500
const TAP_CIRCLE_SIZE = 80
const TAP_ICON_SIZE = 40
const DISCOVERY_CARD_FRAME_SIZE = 7

/**
 * Hook to handle reveal overlay animations
 */
const useRevealAnimations = (onRevealComplete: () => void) => {
  const fadeOut = useSharedValue(1)
  const tapScale = useSharedValue(1)

  useEffect(() => {
    // Start continuous pulsing animation for tap icon
    tapScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1, // infinite loop
      false // don't reverse
    )
  }, [tapScale])

  const triggerReveal = () => {
    fadeOut.value = withDelay(
      FADE_OUT_DELAY,
      withTiming(0, { duration: ANIMATION_DURATION }, () => {
        scheduleOnRN(onRevealComplete)
      })
    )
  }

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }))

  const tapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }],
  }))

  return { overlayAnimatedStyle, tapAnimatedStyle, triggerReveal }
}

interface DiscoveryRevealProps {
  mode: 'reveal' | 'instant'
  blurredImageUrl: string
  onTriggerReveal: () => void
  children: ReactNode
}

/**
 * Reveal overlay wrapper component.
 * Wraps children and shows blur-to-clear reveal animation in reveal mode.
 * In instant mode, shows children immediately without overlay.
 */
export function DiscoveryReveal(props: DiscoveryRevealProps) {
  const { mode, blurredImageUrl, onTriggerReveal, children } = props
  const { styles } = useTheme(createStyles)
  const { locales } = useApp()
  const [isRevealed, setIsRevealed] = useState(mode === 'instant')

  const handleRevealComplete = () => {
    setIsRevealed(true)
  }

  const { overlayAnimatedStyle, tapAnimatedStyle, triggerReveal } = useRevealAnimations(handleRevealComplete)

  // In instant mode or after reveal: render children only
  if (isRevealed) {
    return <>{children}</>
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
          overlayAnimatedStyle
        ]}
      >
        <Pressable
          style={[styles.preview, { flex: 1 }]}
          onPress={handlePress}
        >
          {/* Animated tap icon */}
          <Animated.View style={[styles.tapCircle, tapAnimatedStyle]}>
            <View style={styles.tapIconInner} />
          </Animated.View>

          {/* Discovery message below tap icon */}
          <Text variant="body" style={styles.previewText}>
            {locales.discovery.discovered}
          </Text>
        </Pressable>

        <Animated.Image
          source={{ uri: blurredImageUrl }}
          style={[styles.image]}
          resizeMode='cover'
        />
      </Animated.View>
    </>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  blurredOverlay: {
    padding: DISCOVERY_CARD_FRAME_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  preview: {
    top: DISCOVERY_CARD_FRAME_SIZE,
    left: DISCOVERY_CARD_FRAME_SIZE,
    right: DISCOVERY_CARD_FRAME_SIZE,
    bottom: DISCOVERY_CARD_FRAME_SIZE,
    position: 'absolute',
    zIndex: 99,
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
    position: 'absolute',
    bottom: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 14,
    opacity: 1,
    backgroundColor: theme.colors.black
  },
})
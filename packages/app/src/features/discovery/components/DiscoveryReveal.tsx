import { ReactNode, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { PulsingTapIndicator } from '@app/shared/components/animation/PulsingTapIndicator'
import { Theme, useTheme } from '@app/shared/theme'
import { ImageReference } from '@shared/contracts'

const FADE_OUT_DELAY = 1000
const ANIMATION_DURATION = 1500
export type RevealMode = 'reveal' | 'instant'

/**
 * Hook to handle reveal overlay animations
 */
const useRevealAnimations = (onRevealComplete: () => void) => {
  const fadeOut = useSharedValue(1)

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

  return { overlayAnimatedStyle, triggerReveal }
}

interface DiscoveryRevealProps {
  mode: RevealMode
  blurredImage?: ImageReference
  onReveal: () => void
  children: ReactNode
  padding?: number
}

/**
 * Wrapper component that adds reveal overlay with blur-to-clear animation.
 * In reveal mode: Shows blurred overlay with tap indicator, fades out on tap.
 * In instant mode: Shows children immediately without overlay.
 */
export function DiscoveryReveal(props: DiscoveryRevealProps) {
  const { mode, blurredImage, onReveal, children, padding = 0 } = props
  const { styles: themedStyles } = useTheme((theme) => createThemedStyles(theme, padding))
  const [isRevealed, setIsRevealed] = useState(mode === 'instant')

  const handleRevealComplete = () => {
    setIsRevealed(true)
  }

  const { overlayAnimatedStyle, triggerReveal } = useRevealAnimations(handleRevealComplete)

  const handlePress = () => {
    triggerReveal()
    onReveal()
  }

  return (
    <>
      {children}
      {blurredImage && (
        <Animated.View style={[themedStyles.blurredOverlay, overlayAnimatedStyle, { display: isRevealed ? 'none' : 'flex' }]}>
          <DiscoveryRevealButton onPress={handlePress} />
          <Animated.Image
            source={{ uri: blurredImage.url }}
            style={themedStyles.image}
            resizeMode='cover'
          />
        </Animated.View>
      )}
    </>
  )
}

const createThemedStyles = (theme: Theme, padding: number) => StyleSheet.create({
  blurredOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: theme.colors.black,
  },
})


interface DiscoveryRevealButtonProps {
  onPress: () => void
}

/**
 * Pressable reveal button with pulsing tap indicator.
 */
function DiscoveryRevealButton({ onPress }: DiscoveryRevealButtonProps) {
  return (
    <Pressable style={buttonStyles.preview} onPress={onPress}>
      <PulsingTapIndicator style={buttonStyles.tapIndicator} />
    </Pressable>
  )
}

const buttonStyles = StyleSheet.create({
  preview: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapIndicator: {
    marginBottom: 16,
  },
})
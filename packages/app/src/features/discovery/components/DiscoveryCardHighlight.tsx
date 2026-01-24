import { IconButton } from '@app/shared/components'
import { Flippable } from '@app/shared/components/animation/Flippable'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import Animated, {
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'
import { DiscoveryCardState } from '../logic/types'
import { DiscoveryRevealOverlay } from './DiscoveryRevealOverlay'

const CARD_WIDTH_RATIO = 0.9
const MAX_CARD_WIDTH = 400
const CARD_ASPECT_RATIO = 3 / 4
const IMAGE_ASPECT_RATIO = 3 / 4
const CARD_PADDING = 16
const BORDER_RADIUS = 16
const IMAGE_BORDER_RADIUS = 14
const CLOSE_BUTTON_TOP = 10
const CLOSE_BUTTON_RIGHT = 10
const CLOSE_BUTTON_Z_INDEX = 4
const GRADIENT_COLORS = ['#a341fffd', 'rgba(65, 73, 185, 0.767)'] as const
const FADE_IN_DELAY = 2000
const ANIMATION_DURATION = 1500
const TITLE_OFFSET = 70

/**
 * Hook to calculate responsive card dimensions based on screen width
 */
const useCardDimensions = () => {
  const { width } = useWindowDimensions()
  // For portrait 3:4, calculate width first, then height
  const CARD_WIDTH = Math.min(width * CARD_WIDTH_RATIO, MAX_CARD_WIDTH)
  const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO  // 370 / (3/4) = 370 * 4/3 = 493
  const IMAGE_WIDTH = CARD_WIDTH - CARD_PADDING       // 370 - 16 = 354
  const IMAGE_HEIGHT = CARD_HEIGHT - CARD_PADDING     // 493 - 16 = 477

  return { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT, IMAGE_WIDTH }
}

/**
 * Hook to handle discovery card highlight animations
 * Manages the title fadeIn animation based on reveal mode
 */
const useDiscoveryAnimations = (visible: boolean, mode: 'reveal' | 'instant') => {
  const fadeIn = useSharedValue(mode === 'instant' ? 1 : 0)

  useEffect(() => {
    if (visible && mode === 'instant') {
      fadeIn.value = 1
    } else if (visible && mode === 'reveal') {
      fadeIn.value = 0
    }
  }, [visible, mode, fadeIn])

  const triggerReveal = () => {
    if (mode === 'reveal') {
      fadeIn.value = withDelay(FADE_IN_DELAY, withTiming(1, { duration: ANIMATION_DURATION }))
    }
  }

  return { fadeIn, triggerReveal }
}

interface DiscoveryCardProps {
  card: DiscoveryCardState
  visible: boolean
  mode?: 'reveal' | 'instant'
  onClose?: () => void
  onViewDetails?: (discoveryId: string) => void
}

/**
 * Discovery card highlight component that shows a blur-to-clear reveal animation
 * when a new spot is discovered. Features gradient background and smooth transitions.
 */
function DiscoveryCardHighlight({ card, visible, mode = 'reveal', onClose, onViewDetails }: DiscoveryCardProps) {
  const { styles } = useApp(useStyles)
  const { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT, IMAGE_WIDTH } = useCardDimensions()
  const { fadeIn, triggerReveal } = useDiscoveryAnimations(visible, mode)
  const [isFlipped, setIsFlipped] = useState(false)

  if (!visible || !styles) return null

  // Dynamic styles that depend on dimensions
  const cardContainerStyles = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  }

  const gradientStyles = {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
  }

  const cardStyles = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    maxHeight: CARD_HEIGHT,
  }

  const imageContainerStyles = {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    aspectRatio: IMAGE_ASPECT_RATIO,
  }

  const imageStyles = {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    aspectRatio: IMAGE_ASPECT_RATIO,
  }

  const titleContainerStyles = {
    width: IMAGE_WIDTH,
    top: IMAGE_HEIGHT - TITLE_OFFSET,
  }

  const renderFrondend = () => (<View style={[styles.cardContainer, cardContainerStyles]}>
    {/* Background gradient */}
    <LinearGradient
      style={[styles.gradient, gradientStyles]}
      colors={GRADIENT_COLORS}
    />

    <Pressable
      style={[styles.card, cardStyles]}
      onPress={mode === 'reveal' ? triggerReveal : undefined}
      disabled={mode === 'instant'}
    >
      {/* Close and view details buttons */}
      <View style={styles.buttonContainer}>
        {onViewDetails && (
          <IconButton
            name='zoom-out-map'
            variant='secondary'
            onPress={() => onViewDetails(card.id)}
          />
        )}
        {onClose && (
          <IconButton name='close' variant='secondary' onPress={onClose} />
        )}
      </View>

      {/* Swap button bottom right */}
      <View style={styles.swapButtonContainer}>
        <IconButton
          name='swap-horiz'
          variant='secondary'
          onPress={() => setIsFlipped(isFlipped => !isFlipped)}
        />
      </View>

      <View style={[styles.imageContainer, imageContainerStyles]}>
        {/* Main clear image with title */}
        <View>
          <Animated.Image
            source={{ uri: card.image.url || '' }}
            style={[styles.image, imageStyles]}
            resizeMode='cover'
          />
          <Animated.View
            style={[
              styles.fixedTitleContainer,
              titleContainerStyles,
              { opacity: fadeIn }
            ]}
            pointerEvents='none'
          >
            <Text style={styles.fixedTitle}>{card.title}</Text>
          </Animated.View>
        </View>
      </View>
    </Pressable>
  </View>)

  const renderBackend = () => (<View style={[styles.cardContainer, {
    backgroundColor: 'red', flex: 1, justifyContent: 'center', alignItems: 'center'
  }]}>
    <View style={styles.swapButtonContainer}>
      <IconButton
        name='refresh'
        variant='outlined'
        onPress={() => setIsFlipped(isFlipped => !isFlipped)}
      />
    </View>
  </View>)

  return (
    <Animated.View style={[styles.overlay]}>
      <View style={[styles.cardContainer, cardContainerStyles]}>
        <DiscoveryRevealOverlay
          mode={mode}
          imageHeight={IMAGE_HEIGHT}
          imageWidth={IMAGE_WIDTH}
          blurredImageUrl={card.image.blurredUrl || ''}
          onTriggerReveal={triggerReveal}
        >
          <Flippable
            flipped={isFlipped}
            front={renderFrondend()}
            back={renderBackend()}
          />
        </DiscoveryRevealOverlay>
      </View>
    </Animated.View>
  )
}

const useStyles = createThemedStyles(theme => ({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.opacity(theme.colors.background, 0.8),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  cardContainer: {
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: theme.colors.surface,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  closeButtonContainer: {
    position: 'absolute',
    top: CLOSE_BUTTON_TOP,
    right: CLOSE_BUTTON_RIGHT,
    zIndex: CLOSE_BUTTON_Z_INDEX,
    flexDirection: 'row',
    gap: 8,
  },
  buttonContainer: {
    position: 'absolute',
    top: CLOSE_BUTTON_TOP,
    right: CLOSE_BUTTON_RIGHT,
    zIndex: CLOSE_BUTTON_Z_INDEX,
    flexDirection: 'row',
    gap: 8,
  },
  swapButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: CLOSE_BUTTON_Z_INDEX,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: IMAGE_BORDER_RADIUS,
  },
  image: {
    opacity: 1,
  },
  fixedTitleContainer: {
    position: 'absolute',
    zIndex: 3,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fixedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
}))

export default DiscoveryCardHighlight
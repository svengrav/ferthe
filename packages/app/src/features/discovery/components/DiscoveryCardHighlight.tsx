import { Button, Image, Text } from '@app/shared/components'
import { Flippable } from '@app/shared/components/animation/Flippable'
import { CARD_BORDER_RADIUS, CARD_IMAGE_BORDER_RADIUS, useCardDimensions } from '@app/shared/hooks/useCardDimensions'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'
import { DiscoveryCardState } from '../logic/types'
import { useDiscoveryCardPage } from './DiscoveryCardPage'
import { DiscoveryReveal } from './DiscoveryReveal'
import DiscoveryStats from './DiscoveryStats'

const GRADIENT_COLORS = ['#3a3fa7fd', 'rgb(46, 46, 112)'] as const
const GRADIENT_BACKEND_COLORS = ['#3a3fa7fd', 'rgb(46, 46, 112)'] as const
const FADE_IN_DELAY = 2000
const ANIMATION_DURATION = 600
const TITLE_OFFSET = 70
const CLOSE_BUTTON_TOP = 10
const CLOSE_BUTTON_RIGHT = 10
const CLOSE_BUTTON_Z_INDEX = 4

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

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }))

  return { titleAnimatedStyle, triggerReveal }
}

interface DiscoveryCardProps {
  card: DiscoveryCardState
  visible: boolean
  mode?: 'reveal' | 'instant'
  onClose?: () => void
}

/**
 * Discovery card highlight component that shows a blur-to-clear reveal animation
 * when a new spot is discovered. Features gradient background and smooth transitions.
 */
function DiscoveryCardHighlight({ card, visible, mode = 'reveal', onClose }: DiscoveryCardProps) {
  const { styles } = useApp(useStyles)
  const { cardWidth, cardHeight, imageHeight, imageWidth } = useCardDimensions({ withPadding: true })
  const { titleAnimatedStyle, triggerReveal } = useDiscoveryAnimations(visible, mode)
  const [isFlipped, setIsFlipped] = useState(false)
  const { showDiscoveryCardDetails } = useDiscoveryCardPage()

  if (!visible || !styles) return null

  // Dynamic styles that depend on dimensions
  const cardContainerStyles = {
    width: cardWidth,
    height: cardHeight,
  }

  const gradientStyles = {
    height: cardHeight,
    width: cardWidth,
  }

  const imageContainerStyles = {
    width: imageWidth,
    height: imageHeight,
  }

  const imageStyles = {
    width: imageWidth,
    height: imageHeight,
  }

  const titleContainerStyles = {
    width: imageWidth,
    top: imageHeight - TITLE_OFFSET,
  }

  const renderFrondend = () => (<View style={[styles.cardContainer, cardContainerStyles]}>
    {/* Background gradient */}
    <LinearGradient
      style={[styles.gradient, gradientStyles]}
      colors={GRADIENT_COLORS}
    />

    <Pressable
      style={styles.card}
      onPress={mode === 'reveal' ? triggerReveal : undefined}
      disabled={mode === 'instant'}
    >
      {/* Close and view details buttons */}
      <View style={styles.buttonContainer}>
        <Button
          icon='zoom-out-map'
          variant='secondary'
          onPress={() => showDiscoveryCardDetails(card)}
        />
        {onClose && (
          <Button
            icon='close'
            variant='secondary'
            onPress={onClose}
          />
        )}
      </View>

      {/* Swap button bottom right */}
      <View style={styles.swapButtonContainer}>
        <Button
          icon='swap-horiz'
          variant='secondary'
          onPress={() => setIsFlipped(isFlipped => !isFlipped)}
        />
      </View>

      <View style={[styles.imageContainer, imageContainerStyles]} id="card-image">
        {/* Main clear image with title */}
        <View>
          <Image
            source={card.image}
            width={imageWidth}
            height={imageHeight}
            style={[styles.image, imageStyles]}
            resizeMode='cover'
          />
          <Animated.View
            style={[
              styles.fixedTitleContainer,
              titleContainerStyles,
              titleAnimatedStyle
            ]}
            pointerEvents='none'
          >
            <Text style={styles.fixedTitle}>{card.title}</Text>
          </Animated.View>
        </View>
      </View>
    </Pressable>
  </View>)

  const renderBackend = () => (
    <View style={[styles.backCard, cardContainerStyles]}
      pointerEvents={isFlipped ? 'auto' : 'none'}
      id="card-frame"
    >
      {/* Background gradient */}
      <LinearGradient
        style={[styles.gradient, gradientStyles]}
        colors={GRADIENT_BACKEND_COLORS}
      />

      {/* Close and view details buttons */}
      <View style={styles.buttonContainer}>
        {card.discoveryId && (
          <Button
            icon='zoom-out-map'
            variant='secondary'
            onPress={() => showDiscoveryCardDetails(card)}
          />
        )}
        {onClose && (
          <Button
            icon='close'
            variant='secondary'
            onPress={onClose}
          />
        )}
      </View>

      {/* Scrollable content area */}
      <ScrollView
        style={styles.backScrollView}
        contentContainerStyle={styles.backContentContainer}
        id='scroll'
      >
        <View style={styles.backContent}>
          <Text style={styles.backTitle}>{card.title}</Text>
          <Text style={styles.backText} numberOfLines={2}>{card.description}</Text>
        </View>
        {isFlipped && <DiscoveryStats discoveryId={card.discoveryId} animationDelay={400} style={{ marginTop: 14 }} />}
      </ScrollView>

      {/* Flip button bottom right */}
      <View style={styles.swapButtonContainer}>
        <Button
          icon='swap-horiz'
          variant='secondary'
          onPress={() => setIsFlipped(isFlipped => !isFlipped)}
        />
      </View>
    </View>
  )

  return (
    <Animated.View style={[styles.overlay]}>
      <View style={[styles.cardContainer, cardContainerStyles]}>
        <DiscoveryReveal
          mode={mode}
          blurredImageUrl={card.blurredImage?.url || card.image.url}
          onTriggerReveal={triggerReveal}
        >
          <Flippable
            flipped={isFlipped}
            front={renderFrondend()}
            back={renderBackend()}
          />
        </DiscoveryReveal>
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
    borderRadius: CARD_BORDER_RADIUS,
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
    borderRadius: CARD_BORDER_RADIUS,
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
  backCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  backScrollView: {
    flex: 1,
    width: '100%',
    paddingBottom: 60, // Space for bottom button
  },
  backContentContainer: {
    padding: 20,
  },
  backContent: {
    gap: 12,
  },
  backTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: CARD_IMAGE_BORDER_RADIUS,
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
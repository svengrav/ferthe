import { Image, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import { Pressable, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { DiscoveryCardState as Card } from '../logic/types'

const PAGE_PADDING = 16
const CARD_ASPECT_RATIO = 3 / 2
const ANIMATION_DURATION = 400
const SPRING_FRICTION = 6
const CARD_BORDER_RADIUS = 18
const CLOSE_BUTTON_TOP = 5
const CLOSE_BUTTON_RIGHT = 5
const GRADIENT_COLORS = ['#a341fffd', 'rgba(65, 73, 185, 0.767)'] as const

// Z-Index hierarchy (from bottom to top)
const Z_INDEX = {
  CARD_BACKGROUND: 1,
  CARD_IMAGE: 2,
  IMAGE_OVERLAY: 3,
  TITLE_OVERLAY: 4,
  SCROLL_VIEW: 5,
  CLOSE_BUTTON: 10,
}

/**
 * Hook to calculate responsive card dimensions based on screen width and height
 */
const useCardDimensions = () => {
  const { width, height } = useWindowDimensions()

  // Available space considering padding and system UI (status bar, nav bar, etc.)
  const availableWidth = width - PAGE_PADDING * 2
  // Reserve more space for system UI and navigation
  const availableHeight = height - PAGE_PADDING * 2 - 200 // Reserve 200px for UI elements

  // Calculate card dimensions based on aspect ratio, keeping aspect ratio constant
  const cardWidthFromWidth = Math.min(availableWidth, 400)
  const cardHeightFromWidth = cardWidthFromWidth * CARD_ASPECT_RATIO

  const cardHeightFromHeight = availableHeight
  const cardWidthFromHeight = cardHeightFromHeight / CARD_ASPECT_RATIO

  // Choose the limiting factor while maintaining aspect ratio
  let CARD_WIDTH, CARD_HEIGHT

  if (cardHeightFromWidth <= availableHeight) {
    // Width is the limiting factor
    CARD_WIDTH = cardWidthFromWidth
    CARD_HEIGHT = cardHeightFromWidth
  } else {
    // Height is the limiting factor
    CARD_WIDTH = cardWidthFromHeight
    CARD_HEIGHT = cardHeightFromHeight
  }

  // Image height is the same as card height since they should be the same size
  const IMAGE_HEIGHT = CARD_HEIGHT

  return { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT }
}

/**
 * Hook to handle card animation logic including fade in, scale, and scroll animations
 */
const useCardAnimations = (IMAGE_HEIGHT: number) => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.95)
  const scrollY = useSharedValue(0)

  // Start entrance animation on mount
  useEffect(() => {
    opacity.value = withTiming(1, { duration: ANIMATION_DURATION })
    scale.value = withSpring(1, { damping: SPRING_FRICTION })
  }, [])

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  // Scroll-based animations (not implemented here since no scrolling in this card)
  const titleOpacity = useSharedValue(1)
  const overlayOpacity = useSharedValue(0.2)

  return {
    animatedCardStyle,
    scrollY,
    titleOpacity,
    overlayOpacity,
  }
}

interface DiscoveryCardProps {
  card: Card
  onTap?: () => void
  options?: {
    showBorder?: boolean
    showTitle?: boolean
  }
}

/**
 * Discovery card component that displays a discovered spot with image, title, and description.
 * Features smooth animations and scroll-based parallax effects.
 */
function DiscoveryCard({ card, onTap, options }: DiscoveryCardProps) {
  const { styles, theme } = useApp(useStyles)
  const { title, image, discoveredBy } = card
  const { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT } = useCardDimensions()
  const { animatedCardStyle, titleOpacity } = useCardAnimations(IMAGE_HEIGHT)
  const { showTitle = true, showBorder = false } = options || {}

  // Dynamic styles that depend on dimensions
  const cardDynamicStyles = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  }

  const imageDynamicStyles = {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  }

  const titleContainerDynamicStyles = {
    width: CARD_WIDTH,
    top: IMAGE_HEIGHT - 70,
  }

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }))

  if (!styles) return null

  return (
    <Pressable onPress={onTap}>
      <View style={[styles.card, cardDynamicStyles]} id='discovery-card' pointerEvents="box-none">
        {/* Background image */}
        <LinearGradient
          style={{ position: 'absolute', top: 0, left: 0, width: CARD_WIDTH, height: IMAGE_HEIGHT }}
          colors={GRADIENT_COLORS}
        />
        <View style={{ padding: showBorder ? 6 : 0, flex: 1 }}>
          <Image
            source={{ uri: image.url || '' }}
            style={[styles.fixedImage, imageDynamicStyles]}
            resizeMode='cover'
          />
        </View>

        {/* Discovered By Badge (if community discovery) */}
        {discoveredBy && (
          <View style={styles.discoveredByBadge}>
            <Text variant="body">by {discoveredBy}</Text>
          </View>
        )}

        {/* Fixed title overlay */}
        <Animated.View
          style={[
            styles.fixedTitleContainer,
            titleContainerDynamicStyles,
            titleAnimatedStyle
          ]}
          pointerEvents='none'
        >
          {showTitle && <Text style={styles.fixedTitle}>{title}</Text>}
        </Animated.View>
      </View>
    </Pressable>
  )
}

const useStyles = createThemedStyles(theme => ({
  overlay: {
    position: 'absolute',
    backgroundColor: theme.colors.background,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    alignItems: 'center',
    zIndex: 1,
    flex: 1,
  },
  closeButtonContainer: {
    position: 'absolute',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    top: CLOSE_BUTTON_TOP,
    right: CLOSE_BUTTON_RIGHT,
    zIndex: Z_INDEX.CLOSE_BUTTON,
  },
  card: {
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  fixedImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    zIndex: Z_INDEX.CARD_IMAGE,
  },
  fixedTitleContainer: {
    position: 'absolute',
    zIndex: Z_INDEX.TITLE_OVERLAY,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fixedTitle: {
    fontSize: 28,
    fontWeight: 'semibold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    width: '100%',
    flexGrow: 1,
    flex: 1,
    zIndex: Z_INDEX.SCROLL_VIEW,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    width: '100%',
    flexGrow: 1,
    paddingTop: 16,
  },
  contentContainer: {
    borderRadius: CARD_BORDER_RADIUS,
    backgroundColor: theme.colors.surface,
    width: '100%',
    paddingHorizontal: 8,
    flexGrow: 1,
    minHeight: 400,
  },
  discoveredByBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: Z_INDEX.TITLE_OVERLAY,
  },
}))

export default DiscoveryCard

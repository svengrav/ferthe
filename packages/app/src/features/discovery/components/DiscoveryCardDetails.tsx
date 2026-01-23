import { getAppContext } from '@app/appContext'
import { Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useEffect, useRef, useState } from 'react'
import { Animated, ScrollView, useWindowDimensions, View } from 'react-native'
import { DiscoveryCardState as Card } from '../logic/types'
import DiscoveryReactionSection from './DiscoveryReactionSection'
import DiscoveryUserContentSection from './DiscoveryUserContentSection'
const PAGE_PADDING = 16
const CARD_ASPECT_RATIO = 3 / 2
const CARD_BORDER_RADIUS = 18

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
 * Hook to handle scroll-based animations for title effects
 */
const useCardAnimations = (IMAGE_HEIGHT: number) => {
  const scrollY = useRef(new Animated.Value(0)).current

  // Calculate scroll-based animations
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT * 0.4, IMAGE_HEIGHT * 0.6],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  })

  return {
    scrollY,
    titleOpacity,
  }
}

interface DiscoveryCardProps {
  onClose?: () => void
  card: Card
}

/**
 * Discovery card component that displays a discovered spot with image, title, and description.
 * Features smooth animations and scroll-based parallax effects.
 */
function DiscoveryCardDetails({ card }: DiscoveryCardProps) {
  const { styles, theme } = useApp(useStyles)
  const { discoveryApplication } = getAppContext()
  const { title, image, description, id } = card
  const { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT } = useCardDimensions()
  const { scrollY, titleOpacity } = useCardAnimations(IMAGE_HEIGHT)

  // Content state
  const [isLoading, setIsLoading] = useState(false)

  // Load content on mount
  useEffect(() => {
    if (id) {
      discoveryApplication.getDiscoveryContent(id)
    }
  }, [id, discoveryApplication])

  if (!styles) return null

  return (
    <View style={styles.container}>
      {/* Fixed card container with image */}
      <View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]} pointerEvents="box-none">
        {/* Background image */}
        <Animated.Image
          source={{ uri: image.url || '' }}
          style={[styles.fixedImage, { width: CARD_WIDTH, height: IMAGE_HEIGHT }]}
          resizeMode='cover'
        />

        {/* Fixed title overlay */}
        <Animated.View
          style={[
            styles.fixedTitleContainer,
            { width: CARD_WIDTH, top: IMAGE_HEIGHT - 70 },
            { opacity: titleOpacity }
          ]}
          pointerEvents='none'
        >
          <Text style={styles.fixedTitle}>{title}</Text>
        </Animated.View>
      </View>

      {/* Scrollable content that overlays the image */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Empty space to allow scrolling past the image */}
        <View style={{ height: IMAGE_HEIGHT }} />

        {/* Content area */}
        <View style={styles.contentContainer}>
          <View style={styles.contentHeader} />
          <Text variant="heading">{title}</Text>
          <Text style={styles.discoveredAt}>
            Discovered: {card.discoveredAt ? new Date(card.discoveredAt).toLocaleDateString() : ''}
          </Text>
          
          {/* Reaction buttons */}
          <DiscoveryReactionSection
            id={id}
            isLoading={isLoading}
          />

          {description && (
            <Text style={styles.description}>{description}</Text>
          )}

          {/* User content section */}
          <DiscoveryUserContentSection
            id={id}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  card: {
    padding: 4,
    position: 'absolute',
    top: 0,
    zIndex: Z_INDEX.CARD_BACKGROUND,
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
    top: 0,
    flex: 1,
    zIndex: Z_INDEX.SCROLL_VIEW,
    backgroundColor: 'transparent'
  },
  scrollContent: {
    width: '100%',
    flexGrow: 1,
    paddingTop: 16,
  },
  contentContainer: {
    backgroundColor: theme.colors.surface,
    width: '100%',
    paddingHorizontal: 8,
    minHeight: 400,
  },
  contentHeader: {
    backgroundColor: theme.deriveColor(theme.colors.onBackground, 0.6),
    marginTop: 10,
    borderRadius: 10,
    height: 3,
    width: 40,
    alignSelf: 'center',
  },
  discoveredAt: {
    fontSize: 14,
    color: theme.deriveColor(theme.colors.onSurface, 0.4),
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.onSurface,
    textAlign: 'left',
    lineHeight: 24,
  },
}))

export default DiscoveryCardDetails

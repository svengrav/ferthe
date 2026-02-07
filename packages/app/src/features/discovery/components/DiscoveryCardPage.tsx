import { useEffect } from 'react'
import { useWindowDimensions, View } from 'react-native'
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

import { getAppContext } from '@app/appContext'
import { Button, Page, Text } from '@app/shared/components'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { DiscoveryCardState } from '../logic/types'
import DiscoveryReaction from './DiscoveryReaction'
import DiscoveryShareSection from './DiscoveryShareSection'
import DiscoveryUserContentSection from './DiscoveryUserContentSection'

export const useDiscoveryCardPage = () => ({
  showDiscoveryCardDetails: (card: DiscoveryCardState) => {
    const overlayId = 'discoveryCardDetails-' + card.discoveryId
    setOverlay(
      overlayId,
      <DiscoveryCardPage card={card} onClose={() => closeOverlay(overlayId)} />,

    )
  },
  closeDiscoveryCardDetails: (discoveryId: string) => closeOverlay('discoveryCardDetails-' + discoveryId),
})

const PAGE_PADDING = 16
const CARD_ASPECT_RATIO = 3 / 2
const CARD_BORDER_RADIUS = 18
const RESERVED_UI_SPACE = 200

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
  const availableHeight = height - PAGE_PADDING * 2 - RESERVED_UI_SPACE

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

  const IMAGE_HEIGHT = CARD_HEIGHT

  return { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT }
}

/**
 * Hook to handle scroll-based animations for title effects
 */
const useCardAnimations = (IMAGE_HEIGHT: number) => {
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const titleOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, IMAGE_HEIGHT * 0.4, IMAGE_HEIGHT * 0.6],
      [1, 1, 0],
      'clamp'
    )
    return { opacity }
  })

  return {
    scrollHandler,
    titleOpacityStyle,
  }
}

interface DiscoveryCardPageProps {
  onClose?: () => void
  card: DiscoveryCardState
}

/**
 * Discovery card page that displays a discovered spot with image, title, and description.
 * Features smooth animations and scroll-based parallax effects.
 */
function DiscoveryCardPage(props: DiscoveryCardPageProps) {
  const { card, onClose } = props
  const { styles } = useTheme(createStyles)
  const { locales } = useApp()
  const { discoveryApplication } = getAppContext()
  const { title, image, description, discoveryId } = card
  const { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT } = useCardDimensions()
  const { scrollHandler, titleOpacityStyle } = useCardAnimations(IMAGE_HEIGHT)

  // Load content on mount
  useEffect(() => {
    discoveryApplication.getDiscoveryContent(discoveryId)
  }, [discoveryId, discoveryApplication])

  if (!styles) return null

  const cardStyle = { width: CARD_WIDTH, height: CARD_HEIGHT }
  const imageStyle = { width: CARD_WIDTH, height: IMAGE_HEIGHT }
  const titleContainerStyle = { width: CARD_WIDTH, top: IMAGE_HEIGHT - 70 }
  const imageSpacerStyle = { height: IMAGE_HEIGHT }

  return (
    <Page
      title={locales.discovery.discoveries}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onClose} />}
    >
      {/* Fixed card container with image */}
      <View style={[styles.card, cardStyle]} pointerEvents="box-none">
        {/* Background image */}
        <Animated.Image
          source={{ uri: image.url || '' }}
          style={[styles.fixedImage, imageStyle]}
          resizeMode='cover'
        />

        {/* Fixed title overlay */}
        <Animated.View
          style={[
            styles.fixedTitleContainer,
            titleContainerStyle,
            titleOpacityStyle
          ]}
          pointerEvents='none'
        >
          <Text style={styles.fixedTitle}>{title}</Text>
        </Animated.View>
      </View>

      {/* Scrollable content that overlays the image */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
      >
        {/* Empty space to allow scrolling past the image */}
        <View style={imageSpacerStyle} />

        {/* Content area */}
        <View style={styles.contentContainer}>
          <View style={styles.contentHeader} />
          <Text variant="heading">{title}</Text>
          <Text style={styles.discoveredAt}>
            {locales.discovery.discovered}: {card.discoveredAt ? new Date(card.discoveredAt).toLocaleDateString() : ''}
          </Text>

          {/* Reaction buttons */}
          <DiscoveryReaction id={discoveryId} />

          {/* Share button */}
          <DiscoveryShareSection discoveryId={discoveryId} />

          {description && (
            <Text style={styles.description}>{description}</Text>
          )}

          {/* User content section */}
          <DiscoveryUserContentSection id={discoveryId} />
        </View>
      </Animated.ScrollView>
    </Page>
  )
}

const createStyles = (theme: Theme) => ({
  card: {
    padding: 4,
    position: 'absolute' as const,
    top: 0,
    zIndex: Z_INDEX.CARD_BACKGROUND,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden' as const,
  },
  fixedImage: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    zIndex: Z_INDEX.CARD_IMAGE,
  },
  fixedTitleContainer: {
    position: 'absolute' as const,
    zIndex: Z_INDEX.TITLE_OVERLAY,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fixedTitle: {
    fontSize: 28,
    fontWeight: 'semibold' as const,
    color: 'white',
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    width: '100%' as const,
    top: 0,
    flex: 1,
    zIndex: Z_INDEX.SCROLL_VIEW,
    backgroundColor: 'transparent'
  },
  scrollContent: {
    width: '100%' as const,
    flexGrow: 1,
    paddingTop: 16,
  },
  contentContainer: {
    backgroundColor: theme.colors.surface,
    width: '100%' as const,
    paddingHorizontal: 8,
    minHeight: 400,
  },
  contentHeader: {
    backgroundColor: theme.deriveColor(theme.colors.onBackground, 0.6),
    marginTop: 10,
    borderRadius: 10,
    height: 3,
    width: 40,
    alignSelf: 'center' as const,
  },
  discoveredAt: {
    fontSize: 14,
    color: theme.deriveColor(theme.colors.onSurface, 0.4),
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  description: {
    color: theme.colors.onSurface,
    textAlign: 'left' as const,
    lineHeight: 24,
  },
})

export default DiscoveryCardPage

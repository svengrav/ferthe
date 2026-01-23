import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { LinearGradient } from 'expo-linear-gradient'
import { useWindowDimensions, View } from 'react-native'
import Animated from 'react-native-reanimated'

const CARD_WIDTH_RATIO = 0.9
const MAX_CARD_WIDTH = 100
const CARD_ASPECT_RATIO = 3 / 2
const IMAGE_ASPECT_RATIO = 4 / 3
const CARD_PADDING = 8
const BORDER_RADIUS = 4
const IMAGE_BORDER_RADIUS = 20
const CLOSE_BUTTON_Z_INDEX = 4
const GRADIENT_COLORS = ['#a341fffd', 'rgba(65, 73, 185, 0.767)'] as const

/**
 * Hook to calculate responsive card dimensions based on screen width
 */
const useCardDimensions = (border: boolean) => {
  const { width } = useWindowDimensions()
  const CARD_WIDTH = Math.min(width * CARD_WIDTH_RATIO, MAX_CARD_WIDTH)
  const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT_RATIO

  const IMAGE_HEIGHT = CARD_HEIGHT - (border ? CARD_PADDING : 0)
  const IMAGE_WIDTH = CARD_WIDTH - (border ? CARD_PADDING : 0)

  return { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT, IMAGE_WIDTH }
}


interface SpotCardProps {
  border?: boolean,
  card: {
    image: {
      url?: string
    }
    title?: string
    description?: string
  }
}

/**
 * Discovery card highlight component that shows a blur-to-clear reveal animation
 * when a new spot is discovered. Features gradient background and smooth transitions.
 */
function SpotCard({ card, border }: SpotCardProps) {
  const { styles } = useApp(useStyles)
  const { CARD_WIDTH, CARD_HEIGHT, IMAGE_HEIGHT, IMAGE_WIDTH } = useCardDimensions(border = false)

  if (!styles) return null

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

  const imageStyles = {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    aspectRatio: IMAGE_ASPECT_RATIO,
  }


  return (
    <View style={[styles.cardContainer, cardContainerStyles]}>
      {/* Background gradient */}
      <LinearGradient
        style={[styles.gradient, gradientStyles]}
        colors={GRADIENT_COLORS}
      />

      <View style={[styles.card, cardStyles]}>
        <Animated.Image
          source={{ uri: card.image.url || '' }}
          style={[styles.image, imageStyles]}
          resizeMode='cover'
        />
      </View>
    </View>
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
    zIndex: 999,
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: IMAGE_BORDER_RADIUS,
  },
  image: {
    overflow: 'hidden',
    opacity: 1,
  },
  blurredOverlay: {
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
  },
  previewText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 20,
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

export default SpotCard
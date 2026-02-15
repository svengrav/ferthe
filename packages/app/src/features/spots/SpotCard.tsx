import { CARD_BORDER_RADIUS, CARD_IMAGE_ASPECT_RATIO, CARD_IMAGE_BORDER_RADIUS, useCardDimensions } from '@app/shared/hooks/useCardDimensions'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { LinearGradient } from 'expo-linear-gradient'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

const GRADIENT_COLORS = ['#a341fffd', 'rgba(65, 73, 185, 0.767)'] as const


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
  const { cardWidth, cardHeight, imageHeight, imageWidth } = useCardDimensions({ variant: 'small', withPadding: border })

  if (!styles) return null

  // Dynamic styles that depend on dimensions
  const cardContainerStyles = {
    width: cardWidth,
    height: cardHeight,
  }

  const gradientStyles = {
    height: cardHeight,
    width: cardWidth,
  }

  const cardStyles = {
    width: cardWidth,
    height: cardHeight,
    maxHeight: cardHeight,
  }

  const imageStyles = {
    width: imageWidth,
    height: imageHeight,
    aspectRatio: CARD_IMAGE_ASPECT_RATIO,
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
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: CARD_IMAGE_BORDER_RADIUS,
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
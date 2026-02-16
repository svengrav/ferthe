import { SpotBadge, SpotContainer, SpotGradientFrame, SpotImage, SpotTitle, useSpotCardDimensions } from '@app/features/spot/components'
import { useEffect } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { DiscoveryCardState as Card } from '../logic/types'

const ANIMATION_DURATION = 400
const SPRING_FRICTION = 6
const GRADIENT_COLORS = ['#a341fffd', 'rgba(65, 73, 185, 0.767)'] as const

/**
 * Hook to handle card entrance animation
 */
const useCardAnimations = () => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.95)

  // Start entrance animation on mount
  useEffect(() => {
    opacity.value = withTiming(1, { duration: ANIMATION_DURATION })
    scale.value = withSpring(1, { damping: SPRING_FRICTION })
  }, [opacity, scale])

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return { animatedCardStyle }
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
 * Features smooth entrance animation.
 */
function DiscoveryCard({ card, onTap, options }: DiscoveryCardProps) {
  const { title, image, discoveredBy } = card
  const { width, height } = useSpotCardDimensions({ variant: 'card' })
  const { animatedCardStyle } = useCardAnimations()
  const { showTitle = true, showBorder = false } = options || {}

  return (
    <Animated.View style={animatedCardStyle}>
      <SpotContainer
        width={width}
        height={height}
        withShadow={false}
        onPress={onTap}
      >
        {showBorder ? (
          <SpotGradientFrame colors={GRADIENT_COLORS} padding={6}>
            <SpotImage source={image} />
            {showTitle && <SpotTitle title={title} position="bottom" />}
            {discoveredBy && <SpotBadge text={`by ${discoveredBy}`} position="top-left" />}
          </SpotGradientFrame>
        ) : (
          <>
            <SpotImage source={image} />
            {showTitle && <SpotTitle title={title} position="bottom" />}
            {discoveredBy && <SpotBadge text={`by ${discoveredBy}`} position="top-left" />}
          </>
        )}
      </SpotContainer>
    </Animated.View>
  )
}

export default DiscoveryCard

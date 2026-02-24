import { useCommunityShareDialog } from '@app/features/community/components/CommunityShareDialog'
import { SpotContainer, SpotGradientFrame, SpotImage, SpotTitle, useSpotCardDimensions } from '@app/features/spot/components'
import { spotStore } from '@app/features/spot/stores/spotStore'
import { Button, Text } from '@app/shared/components'
import { Flippable } from '@app/shared/components/animation/Flippable'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'
import { DiscoveryEventState } from '../services/types'
import { discoveryStore } from '../stores/discoveryStore'
import { useDiscoveryCardPage } from './DiscoveryCardPage'
import { DiscoveryReveal, RevealMode } from './DiscoveryReveal'
import DiscoveryStats from './DiscoveryStats'

const FADE_IN_DELAY = 2000
const ANIMATION_DURATION = 600
const CLOSE_BUTTON_TOP = 10
const CLOSE_BUTTON_RIGHT = 10
const CLOSE_BUTTON_Z_INDEX = 4

export const useDiscoveryEventCardOverlay = () => ({
  showDiscoveryEventCard: (spotId: string, options?: { mode: RevealMode }) => {
    const spot = spotStore.getState().byId[spotId]
    const discovery = Object.values(discoveryStore.getState().byId).find(d => d.spotId === spotId)

    if (!spot) {
      console.warn(`[DiscoveryEventCard] Spot not found: ${spotId}`)
      return
    }

    const card: DiscoveryEventState = {
      discoveryId: discovery?.id || '',
      title: spot.name,
      image: spot.image!,
      description: spot.description,
      discoveredAt: discovery?.discoveredAt,
      spotId: spot.id,
      blurredImage: spot.blurredImage,
    }

    const overlayId = 'discoveryEventCard-' + card.discoveryId
    setOverlay(
      overlayId,
      <View id={overlayId} key={overlayId} style={{ zIndex: 100, alignItems: 'center', height: '100%', justifyContent: 'center', flex: 1, flexDirection: 'column' }} >
        <DiscoveryEventCard card={card} onClose={() => closeOverlay(overlayId)} mode={options?.mode} />
      </View>
      ,
    )
  },
  closeDiscoveryEventCard: (discoveryId: string) => closeOverlay('discoveryEventCard-' + discoveryId),
})

/**
 * Hook to handle discovery event card animations
 * Manages the title fadeIn animation based on reveal mode
 */
const useDiscoveryAnimations = (mode: RevealMode) => {
  const fadeIn = useSharedValue(mode === 'instant' ? 1 : 0)

  useEffect(() => {
    if (mode === 'instant') {
      fadeIn.value = 1
    } else if (mode === 'reveal') {
      fadeIn.value = 0
    }
  }, [mode, fadeIn])

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

interface DiscoveryEventCardProps {
  card: DiscoveryEventState
  mode?: RevealMode
  onClose?: () => void
}

/**
 * Discovery event card component that shows a blur-to-clear reveal animation
 * when a new spot is discovered. Features gradient background and smooth transitions.
 */
function DiscoveryEventCard({ card, mode = 'reveal', onClose }: DiscoveryEventCardProps) {
  const { styles } = useTheme(useStyles)
  const { width, height, padding } = useSpotCardDimensions({ variant: 'card' })
  const { titleAnimatedStyle, triggerReveal } = useDiscoveryAnimations(mode)
  const [isFlipped, setIsFlipped] = useState(false)
  const { showDiscoveryCardDetails } = useDiscoveryCardPage()
  const { showCommunityShare } = useCommunityShareDialog()

  if (!styles) return null

  // Dynamic styles that depend on dimensions
  const cardContainerStyles = {
    width,
    height,
  }

  const handleOnReveal = () => {
    if (mode === 'reveal') {
      triggerReveal()
    }
  }

  const renderFrondend = () => (
    <View style={[styles.cardContainer, cardContainerStyles]}>
      <Pressable
        style={styles.card}
        onPress={mode === 'reveal' ? handleOnReveal : undefined}
        disabled={mode === 'instant'}
      >
        {/* Close and view details buttons */}
        <View style={styles.buttonContainer}>
          <Button
            icon='zoom-out-map'
            variant='secondary'
            onPress={() => showDiscoveryCardDetails(card)}
          />
          {card.discoveryId && (
            <Button
              icon='share'
              variant='secondary'
              onPress={() => showCommunityShare(card.discoveryId)}
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

        {/* Swap button bottom right */}
        <View style={styles.swapButtonContainer}>
          <Button
            icon='swap-horiz'
            variant='secondary'
            onPress={() => setIsFlipped(isFlipped => !isFlipped)}
          />
        </View>

        <SpotContainer width={width} height={height} withShadow={true}>
          <SpotGradientFrame padding={padding}>
            <DiscoveryReveal mode={mode} blurredImage={card.blurredImage} onReveal={handleOnReveal} padding={padding}>
              <SpotImage
                source={card.image}
              />
              <Animated.View style={titleAnimatedStyle}>
                <SpotTitle title={card.title} position="bottom" />
              </Animated.View>
            </DiscoveryReveal>
          </SpotGradientFrame>
        </SpotContainer>
      </Pressable>
    </View>
  )

  const renderBackend = () => (
    <View style={[styles.cardContainer, cardContainerStyles]}
      pointerEvents={isFlipped ? 'auto' : 'none'}
      id="card-frame"
    >
      <SpotContainer width={width} height={height} withShadow={true}>
        <SpotGradientFrame padding={6}>
          {/* Close and view details buttons */}
          <View style={styles.buttonContainer}>
            {card.discoveryId && (
              <Button
                icon='zoom-out-map'
                variant='secondary'
                onPress={() => showDiscoveryCardDetails(card)}
              />
            )}
            {card.discoveryId && (
              <Button
                icon='share'
                variant='secondary'
                onPress={() => showCommunityShare(card.discoveryId)}
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
        </SpotGradientFrame>
      </SpotContainer>
    </View>
  )

  return (
    <Flippable
      width={width}
      height={height}
      flipped={isFlipped}
      front={renderFrondend()}
      back={renderBackend()}
    />
  )
}

const useStyles = createThemedStyles(theme => ({
  cardContainer: {
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
}))

export default DiscoveryEventCard
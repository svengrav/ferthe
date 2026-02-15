import { config } from '@app/config'
import { useDiscoveryPreviewClues, useDiscoveryScannedClues } from '@app/features/discovery/stores/discoveryTrailStore'
import { Clue } from '@shared/contracts'
import { GeoBoundary, geoUtils } from '@shared/geo'
import * as Haptics from 'expo-haptics'
import { memo, useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, { Easing, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useMapDevice } from '../../stores/mapStore'
import { MapTheme, useMapTheme } from '../../stores/mapThemeStore'
import { mapUtils } from '../../utils/geoToScreenTransform'
import { useCompensatedScale } from './MapViewport'

const CLUE_SIZE = 20
const FADE_IN_DURATION = 300
const SCALE_DURATION = 400
const FADE_OUT_DURATION = 500
const INITIAL_SCALE = 0.85
const RIPPLE_DELAY_FACTOR = 15
const MAX_RIPPLE_DELAY = 1000
const DEBUG_RADIUS_CIRCLES = [50, 100, 150]

/**
 * Hook to animate clue with ripple effect
 */
const useClueRippleAnimation = (delay: number, isExiting: boolean) => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(INITIAL_SCALE)

  useEffect(() => {
    if (isExiting) {
      opacity.value = withTiming(0, { duration: FADE_OUT_DURATION, easing: Easing.in(Easing.cubic) })
      scale.value = withTiming(INITIAL_SCALE, { duration: FADE_OUT_DURATION, easing: Easing.in(Easing.cubic) })
    } else {
      opacity.value = withDelay(delay, withTiming(1, { duration: FADE_IN_DURATION, easing: Easing.out(Easing.cubic) }))
      scale.value = withDelay(delay, withTiming(1, { duration: SCALE_DURATION, easing: Easing.out(Easing.cubic) }))
    }
  }, [delay, isExiting, opacity, scale])

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))
}

/**
 * Create styles for the clue marker
 */
const createClueStyles = (theme: MapTheme, clueSize: number, scaleValue: number) => ({
  animatedContainer: {
    position: 'absolute' as const,
    width: clueSize,
    height: clueSize,
    marginLeft: -clueSize / 2,
    marginTop: -clueSize / 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clueMarker: {
    width: clueSize,
    height: clueSize,
    borderRadius: clueSize / 2,
    backgroundColor: theme.clue.fill,
    borderWidth: theme.clue.strokeWidth * scaleValue,
    borderColor: theme.clue.strokeColor,
  },
})

/**
 * Create styles for the radius circles
 */
const createRadiusStyles = (theme: MapTheme, scaleValue: number) => ({
  discoveryRadius: {
    position: 'absolute' as const,
    borderWidth: theme.radius.strokeWidth * scaleValue,
    borderColor: theme.radius.strokeColor,
    backgroundColor: theme.radius.fill,
  },
  debugCircle: {
    position: 'absolute' as const,
    borderWidth: 1 * scaleValue,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    backgroundColor: 'transparent',
  },
})

/**
 * Discovery radius component (memoized)
 */
interface ClueRadiusProps {
  clue: Clue
  boundary: GeoBoundary
  size: { width: number; height: number }
  scale: number
  theme: MapTheme
}

const ClueDiscoveryRadius = memo(({ clue, boundary, size, scale, theme }: ClueRadiusProps) => {
  const circle = mapUtils.calculateCircleDimensions(clue.location, clue.discoveryRadius, boundary, size)
  const styles = createRadiusStyles(theme, scale)

  return (
    <View
      style={[
        styles.discoveryRadius,
        {
          ...circle,
          borderRadius: circle.width / 2,
        }
      ]}
    />
  )
})

/**
 * Debug circles component (memoized)
 */
const ClueDebugCircles = memo(({ clue, boundary, size, scale, theme }: ClueRadiusProps) => {
  if (!config.debug.enableMapDebug) return null

  const styles = createRadiusStyles(theme, scale)

  return (
    <>
      {DEBUG_RADIUS_CIRCLES.map(radius => {
        const circle = mapUtils.calculateCircleDimensions(clue.location, radius, boundary, size)
        return (
          <View
            key={radius}
            style={[
              styles.debugCircle,
              {
                ...circle,
                borderRadius: circle.width / 2,
              }
            ]}
          />
        )
      })}
    </>
  )
})

/**
 * Individual animated clue component with ripple effect
 */
interface AnimatedClueProps {
  clue: Clue
  delay: number
  isExiting: boolean
  boundary: GeoBoundary
  size: { width: number; height: number }
  scale: number
  theme: MapTheme
}

const AnimatedClue = memo(({ clue, delay, isExiting, boundary, size, scale, theme }: AnimatedClueProps) => {
  const animatedStyle = useClueRippleAnimation(delay, isExiting)
  const position = mapUtils.coordinatesToPosition(clue.location, boundary, size)
  const clueSize = CLUE_SIZE * scale
  const styles = createClueStyles(theme, clueSize, scale)

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.animatedContainer,
        {
          left: position.x,
          top: position.y,
        }
      ]}
    >
      <ClueDiscoveryRadius clue={clue} boundary={boundary} size={size} scale={scale} theme={theme} />
      <ClueDebugCircles clue={clue} boundary={boundary} size={size} scale={scale} theme={theme} />
      <View style={styles.clueMarker} />
    </Animated.View>
  )
})

interface ClueWithState {
  clue: Clue
  delay: number
  isExiting: boolean
}

/**
 * Hook to manage clue lifecycle with fade in/out animations
 * Handles adding new clues with ripple delay and removing old clues with fade out
 */
const useScanCluesWithLifecycle = (scanClues: Clue[], deviceLocation: { lat: number; lon: number }): ClueWithState[] => {
  const [visibleClues, setVisibleClues] = useState<ClueWithState[]>([])

  useEffect(() => {
    // Extract IDs for comparison
    const currentIds = scanClues.map(c => c.spotId || c.id)
    const visibleIds = visibleClues.map(c => c.clue.spotId || c.clue.id)

    // Add new clues
    const cluesToAdd = scanClues.filter(clue => {
      const id = clue.spotId || clue.id
      return !visibleIds.includes(id)
    })

    if (cluesToAdd.length > 0) {
      const newClues = cluesToAdd.map(clue => {
        const distance = geoUtils.calculateDistance(deviceLocation, clue.location)
        const delay = Math.min(distance * RIPPLE_DELAY_FACTOR, MAX_RIPPLE_DELAY)
        return { clue, delay, isExiting: false }
      })
      setVisibleClues(prev => [...prev, ...newClues])

      // Trigger haptic feedback when new clues appear
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }

    // Mark removed clues as exiting
    const idsToRemove = visibleIds.filter(id => !currentIds.includes(id))

    if (idsToRemove.length > 0) {
      setVisibleClues(prev => prev.map(item => {
        const id = item.clue.spotId || item.clue.id
        return idsToRemove.includes(id) ? { ...item, isExiting: true } : item
      }))

      // Remove after fade out animation
      setTimeout(() => {
        setVisibleClues(prev => prev.filter(item => {
          const id = item.clue.spotId || item.clue.id
          return !idsToRemove.includes(id)
        }))
      }, FADE_OUT_DURATION)
    }
  }, [scanClues, deviceLocation])

  return visibleClues
}

/**
 * Hook to sync SharedValue to React state for style calculations
 */
const useSharedValueAsNumber = (sharedValue: any): number => {
  const [value, setValue] = useState(sharedValue.value)

  useAnimatedReaction(
    () => sharedValue.value,
    (current) => {
      runOnJS(setValue)(current)
    },
    [sharedValue]
  )

  return value
}

interface MapCluesProps {
  boundary: GeoBoundary
  size: { width: number; height: number }
}

/**
 * Component that renders map clues with ripple animation for scan events
 */
function MapClues({ boundary, size }: MapCluesProps) {
  const previewClues = useDiscoveryPreviewClues() ?? []
  const scannedClues = useDiscoveryScannedClues()
  const device = useMapDevice()
  const theme = useMapTheme()
  const scale = useCompensatedScale()

  // Sync SharedValue to number for style calculations
  const scaleValue = useSharedValueAsNumber(scale)

  const scannedCluesWithState = useScanCluesWithLifecycle(scannedClues, device.location)

  return (
    <>
      {/* Static preview clues */}
      {previewClues.map((clue, index) => {
        const position = mapUtils.coordinatesToPosition(clue.location, boundary, size)
        const clueSize = CLUE_SIZE * scaleValue
        const styles = createClueStyles(theme, clueSize, scaleValue)

        return (
          <View
            key={clue.spotId || index}
            style={[
              styles.animatedContainer,
              {
                left: position.x,
                top: position.y,
              }
            ]}
          >
            <ClueDiscoveryRadius clue={clue} boundary={boundary} size={size} scale={scaleValue} theme={theme} />
            <ClueDebugCircles clue={clue} boundary={boundary} size={size} scale={scaleValue} theme={theme} />
            <View style={styles.clueMarker} />
          </View>
        )
      })}

      {/* Animated scan clues with ripple effect */}
      {scannedCluesWithState.map(({ clue, delay, isExiting }, index) => (
        <AnimatedClue
          key={clue.spotId || index}
          clue={clue}
          delay={delay}
          isExiting={isExiting}
          boundary={boundary}
          size={size}
          scale={scaleValue}
          theme={theme}
        />
      ))}
    </>
  )
}

export default memo(MapClues)

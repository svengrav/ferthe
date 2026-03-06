import { Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { StumbleSuggestion } from '@shared/contracts'
import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useMapCanvas } from '../../stores/mapStore'
import { mapUtils } from '../../services/geoToScreenTransform'
import { useStumbleSuggestions } from '@app/features/stumble/stumbleStore'
import { useIsStumbleTrail } from '@app/features/stumble'
import { useStumbleReachedCard } from '@app/features/stumble/components/StumbleReachedCard'
import { useDeviceLocation } from '@app/features/sensor/stores/sensorStore'
import { geoUtils } from '@shared/geo'

const REACH_RADIUS_METERS = 5

/**
 * Renders Stumble Mode suggestion markers on the map canvas.
 * Each marker is a circle matching the physical reach radius.
 * When user enters the radius the card auto-pops up.
 */
export function MapStumbleOverlay() {
  const isActive = useIsStumbleTrail()
  const suggestions = useStumbleSuggestions()
  const { boundary, size } = useMapCanvas()
  const device = useDeviceLocation()
  const { showStumbleReachedCard } = useStumbleReachedCard()
  const shownRef = useRef<Set<string>>(new Set())

  const positions = useMemo(() =>
    suggestions.map(s => {
      const distance = device?.location
        ? geoUtils.calculateDistance(device.location, s.location)
        : Infinity
      const center = mapUtils.coordinatesToPosition(s.location, boundary, size)
      const circle = mapUtils.calculateCircleDimensions(s.location, REACH_RADIUS_METERS, boundary, size)
      return {
        suggestion: s,
        center,
        circleDiameter: circle.width,
        isReached: distance <= REACH_RADIUS_METERS,
      }
    }),
    [suggestions, boundary, size.width, size.height, device?.location]
  )

  // Auto-show card when user first enters range of a POI
  useEffect(() => {
    for (const { suggestion, isReached } of positions) {
      if (isReached && !shownRef.current.has(suggestion.id)) {
        shownRef.current.add(suggestion.id)
        showStumbleReachedCard(suggestion)
        break // show one at a time
      }
    }
  }, [positions])

  // Reset shown set when stumble mode deactivates
  useEffect(() => {
    if (!isActive) shownRef.current.clear()
  }, [isActive])

  if (!isActive || positions.length === 0) return null

  return (
    <>
      {positions.map(({ suggestion, center, circleDiameter, isReached }) => (
        <StumbleMarker
          key={suggestion.id}
          suggestion={suggestion}
          cx={center.x}
          cy={center.y}
          diameter={circleDiameter}
          isReached={isReached}
        />
      ))}
    </>
  )
}

interface StumbleMarkerProps {
  suggestion: StumbleSuggestion
  cx: number
  cy: number
  diameter: number
  isReached: boolean
}

function StumbleMarker({ suggestion, cx, cy, diameter, isReached }: StumbleMarkerProps) {
  const { styles } = useTheme(createStyles)

  const opacity = useSharedValue(1)

  useEffect(() => {
    if (isReached) {
      opacity.value = 1
      return
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      false,
    )
  }, [isReached])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const radius = diameter / 2

  return (
    <View
      style={[
        styles.wrapper,
        {
          position: 'absolute',
          left: cx - radius,
          top: cy - radius,
          width: diameter,
          height: diameter,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.circle,
          isReached && styles.circleReached,
          { borderRadius: radius, width: diameter, height: diameter },
          animatedStyle,
        ]}
      />
      {/* Name label centered below the circle */}
      <View style={[styles.nameTag, { top: diameter + 4 }]}>
        <Text variant="caption" style={styles.name} numberOfLines={1}>
          {suggestion.name}
        </Text>
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  wrapper: {
    zIndex: 200,
  },
  circle: {
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
    backgroundColor: theme.deriveColor(theme.colors.secondary, 0.12),
  },
  circleReached: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.deriveColor(theme.colors.primary, 0.2),
    borderWidth: 2,
  },
  nameTag: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.9),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 120,
  },
  name: {
    color: theme.colors.onSurface,
    fontSize: 10,
  },
})

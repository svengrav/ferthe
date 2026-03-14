import { Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { Theme, useTheme } from '@app/shared/theme'
import { StumbleSuggestionResult } from '@shared/contracts'
import { memo, useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useMapCanvasBoundary, useMapCanvasDimensions } from '../../stores/mapStore'
import { useMapCompensatedScale } from './MapCompensatedScale'
import { mapUtils } from '../../services/geoToScreenTransform'
import { useStumbleSuggestions, useStumbleVisitedPoiIds } from '@app/features/stumble/stumbleStore'
import { useIsStumbleTrail } from '@app/features/stumble'
import { useStumbleReachedCard } from '@app/features/stumble/components/StumbleReachedCard'
import { useDeviceGeoLocation } from '@app/features/sensor/stores/sensorStore'
import { geoUtils } from '@shared/geo'
import { STUMBLE_REACH_RADIUS_METERS } from '@app/features/stumble/config'

/**
 * Renders Stumble Mode suggestion markers on the map canvas.
 * Each marker is a circle matching the physical reach radius.
 * When user enters the radius the card auto-pops up.
 */
export function MapStumbleOverlay() {
  const isActive = useIsStumbleTrail()
  const suggestions = useStumbleSuggestions()
  const visitedPoiIds = useStumbleVisitedPoiIds()
  const boundary = useMapCanvasBoundary()
  const size = useMapCanvasDimensions()
  const deviceLocation = useDeviceGeoLocation()
  const { showStumbleReachedCard } = useStumbleReachedCard()
  const shownRef = useRef<Set<string>>(new Set())

  // Geo positions: recalculate only when boundary/size/suggestions change
  const markerPositions = useMemo(() =>
    suggestions.map(s => {
      const center = mapUtils.coordinatesToPosition(s.location, boundary, size)
      const circle = mapUtils.calculateCircleDimensions(s.location, STUMBLE_REACH_RADIUS_METERS, boundary, size)
      return { suggestion: s, center, circleDiameter: circle.width }
    }),
    [suggestions, boundary, size]
  )

  // Reached state: recalculate only when device location changes
  const positions = useMemo(() =>
    markerPositions.map(m => ({
      ...m,
      isReached: deviceLocation
        ? geoUtils.calculateDistance(deviceLocation, m.suggestion.location) <= STUMBLE_REACH_RADIUS_METERS
        : false,
    })),
    [markerPositions, deviceLocation]
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
          isVisited={visitedPoiIds.has(suggestion.id)}
        />
      ))}
    </>
  )
}

interface StumbleMarkerProps {
  suggestion: StumbleSuggestionResult
  cx: number
  cy: number
  diameter: number
  isReached: boolean
  isVisited: boolean
}

const StumbleMarker = memo(function StumbleMarker({ suggestion, cx, cy, diameter, isReached, isVisited }: StumbleMarkerProps) {
  const { styles } = useTheme(createStyles)
  const { locales } = useLocalization()
  const compensatedScale = useMapCompensatedScale()

  const opacity = useSharedValue(1)

  useEffect(() => {
    if (isVisited) {
      opacity.value = withTiming(0.35, { duration: 400 })
      return
    }
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
  }, [isReached, isVisited])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: compensatedScale.value }],
  }), [compensatedScale])

  const radius = diameter / 2

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          position: 'absolute',
          left: cx,
          top: cy,
        },
        scaleStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.circle,
          isReached && styles.circleReached,
          isVisited && styles.circleVisited,
          { borderRadius: radius, width: diameter, height: diameter, left: -radius, top: -radius },
          animatedStyle,
        ]}
      />
      {/* Category label centered below the circle */}
      <View style={[styles.nameTag, { top: radius + 4 }]}>
        <Text variant="caption" style={[styles.name, isVisited && styles.nameVisited]}>
          {isVisited ? '✓ ' : ''}{locales.stumble.categories[suggestion.category]}
        </Text>
      </View>
    </Animated.View>
  )
})

const createStyles = (theme: Theme) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 200,
  },
  circle: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
    backgroundColor: theme.deriveColor(theme.colors.secondary, 0.12),
  },
  circleReached: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.deriveColor(theme.colors.primary, 0.2),
    borderWidth: 2,
  },
  circleVisited: {
    borderColor: theme.colors.onSurface,
    backgroundColor: theme.deriveColor(theme.colors.onSurface, 0.08),
    borderStyle: 'dashed',
  },
  nameTag: {
    position: 'absolute',
    transform: [{ translateX: "-50%" }],
    alignItems: 'center',
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.9),
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  name: {
    color: theme.colors.onSurface,
    fontSize: 10,
  },
  nameVisited: {
    color: theme.deriveColor(theme.colors.onSurface, 0.5),
  },
})

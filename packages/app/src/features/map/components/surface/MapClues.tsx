import { Clue } from '@shared/contracts'
import { memo, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useCompensatedScale, useMapPreviewClues, useMapScannedClues, useMapSurfaceBoundary, useMapSurfaceLayout } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { mapUtils } from '../../utils/geoToScreenTransform.'

const CLUE_SIZE = 20
const CLUE_RADIUS = 10
const CLUE_OFFSET_X = 10
const CLUE_OFFSET_Y = 10
const FADE_IN_DURATION = 500
const SCALE_DURATION = 600
const FADE_OUT_DURATION = 700
const INITIAL_SCALE = 0.8

/**
 * Custom hook to manage animated scan clues visibility and transitions
 */
const useScanCluesAnimation = (scanClues: Clue[]) => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(INITIAL_SCALE)
  const [visibleClues, setVisibleClues] = useState<Clue[]>([])
  const [isVisible, setIsVisible] = useState(false)

  // Track clue changes based on IDs to trigger proper updates
  const scanCluesIds = useMemo(() =>
    scanClues.map(c => c.spotId || c.id).join(','),
    [scanClues]
  )

  useEffect(() => {
    if (scanClues.length > 0 && !isVisible) {
      // New clues appeared - fade in
      setVisibleClues(scanClues)
      setIsVisible(true)
      opacity.value = withTiming(1, { duration: FADE_IN_DURATION, easing: Easing.out(Easing.cubic) })
      scale.value = withTiming(1, { duration: SCALE_DURATION, easing: Easing.out(Easing.back(1.1)) })
    } else if (scanClues.length === 0 && isVisible) {
      // Clues were cleared - fade out
      opacity.value = withTiming(0, { duration: FADE_OUT_DURATION, easing: Easing.in(Easing.cubic) })
      scale.value = withTiming(INITIAL_SCALE, { duration: FADE_OUT_DURATION, easing: Easing.in(Easing.cubic) })

      // Clear visible clues after animation completes
      setTimeout(() => {
        setVisibleClues([])
        setIsVisible(false)
      }, FADE_OUT_DURATION)
    }
  }, [scanCluesIds, isVisible])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return { visibleClues, animatedStyle }
}

/**
 * Component that renders map clues with animation support for scan events
 * Surface-centric: Positions calculated once relative to surface.boundary + surface.layout
 */
function MapClues() {
  const scale = useCompensatedScale()
  const previewClues = useMapPreviewClues()
  const scannedClues = useMapScannedClues()
  const boundary = useMapSurfaceBoundary()
  const surfaceLayout = useMapSurfaceLayout()
  const mapTheme = useMapTheme()

  const { visibleClues, animatedStyle } = useScanCluesAnimation(scannedClues)

  // Pre-calculate all clue positions (surface-centric)
  // Memoized: only recalc when boundary or layout size changes
  const previewPositions = useMemo(() => {
    return previewClues.map(clue => ({
      clue,
      position: mapUtils.coordinatesToPosition(
        clue.location,
        boundary,
        { width: surfaceLayout.width, height: surfaceLayout.height }
      )
    }))
  }, [previewClues, boundary, surfaceLayout.width, surfaceLayout.height])

  const scannedPositions = useMemo(() => {
    return visibleClues.map(clue => ({
      clue,
      position: mapUtils.coordinatesToPosition(
        clue.location,
        boundary,
        { width: surfaceLayout.width, height: surfaceLayout.height }
      )
    }))
  }, [visibleClues, boundary, surfaceLayout.width, surfaceLayout.height])

  // Render clue marker at pre-calculated position
  const renderClueMarker = ({ clue, position }: { clue: Clue; position: { x: number; y: number } }, index: number) => (
    <View
      key={clue.spotId || index}
      style={[
        clueMarkerStyle({
          fill: mapTheme.clue.fill,
          strokeColor: mapTheme.clue.strokeColor,
          strokeWidth: mapTheme.clue.strokeWidth
        }),
        {
          position: 'absolute',
          left: position.x - (CLUE_OFFSET_X * scale),
          top: position.y - (CLUE_OFFSET_Y * scale),
          width: CLUE_SIZE * scale,
          height: CLUE_SIZE * scale,
          borderRadius: CLUE_RADIUS * scale
        }
      ]}
    />
  )

  return (
    <>
      {/* Static preview clues */}
      {previewPositions.map(renderClueMarker)}

      {/* Animated scan clues */}
      <Animated.View style={animatedStyle}>
        {scannedPositions.map(renderClueMarker)}
      </Animated.View>
    </>
  )
}

// Helper function for clue marker styling
const clueMarkerStyle = (style: { fill: string; strokeColor: string; strokeWidth: number }) => ({
  backgroundColor: style.fill,
  borderWidth: style.strokeWidth,
  borderColor: style.strokeColor,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
})

export default memo(MapClues)

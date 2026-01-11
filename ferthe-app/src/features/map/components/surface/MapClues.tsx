import { Clue } from '@shared/contracts'
import { memo, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useCompensatedScale, useMapBoundary, useMapCanvas, useMapPreviewClues, useMapScannedClues } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { GeoPositioner } from './MapElements'

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
 */
function MapClues() {
  const scale = useCompensatedScale()
  const previewClues = useMapPreviewClues()
  const scannedClues = useMapScannedClues()
  const canvas = useMapCanvas()
  const boundary = useMapBoundary()
  const mapTheme = useMapTheme()
  // Separate clues by source type

  const { visibleClues, animatedStyle } = useScanCluesAnimation(scannedClues)

  // Helper function to render a single clue marker
  const renderClueMarker = (clue: Clue, index: number) => (
    <GeoPositioner
      boundary={boundary}
      size={canvas.size}
      key={clue.spotId || index}
      location={clue.location}
      offsetX={CLUE_OFFSET_X * scale}
      offsetY={CLUE_OFFSET_Y * scale}
    >
      <View style={[clueMarkerStyle({
        fill: mapTheme.clue.fill,
        strokeColor: mapTheme.clue.strokeColor,
        strokeWidth: mapTheme.clue.strokeWidth
      }), {
        width: CLUE_SIZE * scale,
        height: CLUE_SIZE * scale,
        borderRadius: CLUE_RADIUS * scale
      }]} />
    </GeoPositioner>
  )

  return (
    <>
      {/* Static preview clues */}
      {previewClues.map(renderClueMarker)}

      {/* Animated scan clues */}
      <Animated.View style={animatedStyle}>
        {visibleClues.map(renderClueMarker)}
      </Animated.View>
    </>
  )
}

// Helper function for clue marker styling
const clueMarkerStyle = (style: { fill: string; strokeColor: string; strokeWidth: number }) => ({
  position: 'absolute' as const,
  backgroundColor: style.fill,
  borderWidth: style.strokeWidth,
  borderColor: style.strokeColor,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
})

export default memo(MapClues)

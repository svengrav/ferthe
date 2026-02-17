import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useMapStore, useMapSurface } from '../../stores/mapStore.ts'
import { useMapRawScale } from '../surface/MapCompensatedScale.tsx'

const GRAIN_STRENGTH = 1
const GRAIN_THRESHOLD = 1 // Start showing grain at 1x zoom

/**
 * Tileable noise pattern
 */
const GRAIN_PATTERN = require('./grain.png')

interface MapGrainProps {
  mode?: 'canvas' | 'overview'
}

/**
 * MapGrain - Displays subtle film grain that increases with zoom level.
 * Applies inverse transformation to keep grain sharp at all zoom levels.
 * The grain pattern maintains constant pixel density while covering the full surface.
 */
function MapGrain({ mode = 'canvas' }: MapGrainProps) {
  const { styles } = useApp(useStyles)
  const { layout } = useMapSurface()
  const rawScale = useMapRawScale()

  const scaleConfig = useMapStore(state =>
    mode === 'canvas' ? state.canvas.scale : state.overview.scale
  )

  const animatedStyle = useAnimatedStyle(() => {
    'worklet'
    const scale = rawScale.value
    const inverseScale = 1 / scale

    // Opacity based on zoom level
    let opacity = 0
    if (scale >= GRAIN_THRESHOLD) {
      const normalizedScale = (scale - GRAIN_THRESHOLD) / (scaleConfig.max - GRAIN_THRESHOLD)
      opacity = Math.min(normalizedScale * GRAIN_STRENGTH, GRAIN_STRENGTH)
    }

    // Apply full inverse transformation to compensate parent scaling
    // Translation compensates for scale transform-origin being center
    // Negative translation when zoomed in (inverseScale < 1) moves overlay to top-left
    const translateX = layout.width * (inverseScale - 1) / 2
    const translateY = layout.height * (inverseScale - 1) / 2

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale: inverseScale }
      ]
    }
  }, [scaleConfig.max, layout.width, layout.height])

  // Fixed image size based on max zoom to prevent flickering during scale animation
  // Large enough to cover surface at maximum zoom level
  const imageWidth = layout.width * scaleConfig.max
  const imageHeight = layout.height * scaleConfig.max

  return (
    <Animated.View style={[styles?.container, animatedStyle]} pointerEvents="none" id="map-canvas-grain">
      <Animated.Image
        source={GRAIN_PATTERN}
        style={[styles?.grainOverlay, { width: imageWidth, height: imageHeight }]}
        // @ts-ignore - resizeMode works with Animated.Image
        resizeMode="repeat"
        fadeDuration={0}
      />
    </Animated.View>
  )
}

const useStyles = createThemedStyles(() => ({
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  grainOverlay: {
    // Dimensions set dynamically based on surface layout and scale
  },
}))

export default MapGrain

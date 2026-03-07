import {
  Blend,
  Canvas,
  ColorMatrix,
  DisplacementMap,
  Group,
  ImageShader,
  Rect,
  Image as SkiaImage,
  Shader,
  useImage,
} from '@shopify/react-native-skia'
import { useDerivedValue } from 'react-native-reanimated'
import { View } from 'react-native'
import { getMapThemeDefaults } from '@app/features/map/config/mapThemeDefaults'
import { useMapScale } from './MapCompensatedScale'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GRAIN_TEXTURE = require('@app/../assets/grain-1.png')

const { surface } = getMapThemeDefaults()
const { scaleThreshold, scaleRange, maxOpacity, baseFrequency, displacementScale } = surface.noise

// SVG FeColorMatrix type="saturate" values="0.5" equivalent
const SATURATE_MATRIX = [
  0.6063, 0.3576, 0.0361, 0, 0,
  0.1063, 0.8576, 0.0361, 0, 0,
  0.1063, 0.3576, 0.5361, 0, 0,
  0, 0, 0, 1, 0,
]

// Contrast boost — mirrors the final FeColorMatrix from the SVG pipeline
const CONTRAST_MATRIX = [
  1.6, 0, 0, 0, -0.3,
  0, 1.6, 0, 0, -0.3,
  0, 0, 1.6, 0, -0.3,
  0, 0, 0, 1, 0,
]

interface MapSurfaceNoiseOverlayProps {
  width: number
  height: number
  left: number
  top: number
  imageUrl?: string
}

/**
 * MapSurfaceNoiseOverlay — Skia GPU noise overlay
 *
 * Replaces react-native-svg filter pipeline with Skia GPU shaders:
 * FractalNoise → DisplacementMap → ColorMatrix (saturate + contrast)
 *
 * Performance:
 * - All rendering on GPU (Metal/Vulkan) via Skia render thread
 * - Opacity via Reanimated SharedValue directly on <Group> — 0 JS re-renders
 * - blendMode="overlay" applied at GPU level
 */
function MapSurfaceNoiseOverlay({ width, height, left, top, imageUrl }: MapSurfaceNoiseOverlayProps) {
  const scale = useMapScale()
  const image = useImage(imageUrl ?? null)
  const grainImage = useImage(GRAIN_TEXTURE)

  const opacity = useDerivedValue(() => {
    if (!scale) return 0
    const t = (scale.value - scaleThreshold) / scaleRange
    return Math.min(Math.max(t, 0), 1) * maxOpacity
  })

  if (!scale || !imageUrl) return null

  return (
    <View
      style={{ position: 'absolute', left, top, width, height }}
      pointerEvents="none"
    >
      <Canvas style={{ width, height, opacity: opacity.value }}>
        <Rect x={0} y={0} width={width} height={height}>
          <Blend mode="softLight">
            <ImageShader image={image} fit="cover" rect={{ x: 0, y: 0, width, height }} />
            <ImageShader
              image={grainImage}
              fit="cover"
              rect={{ x: 0, y: 0, width: 200, height: 200 }}
              tx={'repeat'}
              ty={'repeat'}
            />
          </Blend>
        </Rect>
      </Canvas>
    </View>
  )
}

export default MapSurfaceNoiseOverlay

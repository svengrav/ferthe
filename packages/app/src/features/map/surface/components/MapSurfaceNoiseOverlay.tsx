import { getMapThemeDefaults } from '@app/features/map/config/mapThemeDefaults'
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { Defs, FeColorMatrix, FeComposite, FeDisplacementMap, FeGaussianBlur, FeImage, FeTurbulence, Filter, Rect, Svg } from 'react-native-svg'
import { useMapScale } from './MapCompensatedScale'

const { surface } = getMapThemeDefaults()
const { scaleThreshold, scaleRange, maxOpacity, baseFrequency, displacementScale } = surface.noise

/**
 * MapSurfaceNoiseOverlay
 *
 * Renders a GPU-rasterized color-aware noise texture over the trail surface image.
 * Uses feImage + feDisplacementMap to warp the image's own colors into organic grain.
 * The SVG is static and rasterized once — opacity animation runs on the UI thread.
 *
 * Performance:
 * - shouldRasterizeIOS / renderToHardwareTextureAndroid → rasterized once to GPU texture
 * - Image URL is static (same as trail image) — no movement, no invalidation
 * - Opacity driven by Reanimated SharedValue → 0 JS re-renders
 */
interface MapSurfaceNoiseOverlayProps {
  width: number
  height: number
  left: number
  top: number
  imageUrl?: string
}

function MapSurfaceNoiseOverlay({ width, height, left, top, imageUrl }: MapSurfaceNoiseOverlayProps) {
  const scale = useMapScale()

  const noiseOpacity = useDerivedValue(() => {
    if (!scale) return 0
    const t = (scale.value - scaleThreshold) / scaleRange
    return Math.min(Math.max(t, 0), 1) * maxOpacity
  })

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: noiseOpacity.value,
  }))

  if (!scale) return null

  return (
    <Animated.View
      style={[{ position: 'absolute', left, top, width, height, experimental_blendMode: 'overlay' } as any, animatedStyle]}
      pointerEvents="none"
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
    >
      <Svg width={width} height={height}>
        <Defs>

          <Filter id="colorNoise" x="0%" y="0%" width="100%" height="100%">
            {/* Warp image pixels with turbulence — high displacement = abstract color smear */}
            <FeTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves={4}
              stitchTiles="stitch"
              result="noise"
            />

            <FeTurbulence type="fractalNoise" baseFrequency={0.50} numOctaves={1} result="noise2" />
            <FeComposite in="noise" in2="noise2" operator="arithmetic" k1="0" k2="1" k3="0.6" k4="0" result="noiseMix" />
            {imageUrl ? (
              <>
                <FeImage href={imageUrl} width={width} height={height} result="src" preserveAspectRatio="xMidYMid slice" />
                <FeDisplacementMap in="src" in2="noiseMix" scale={displacementScale} xChannelSelector="R" yChannelSelector="G" result="displaced" />
                {/* Reduce saturation to blend naturally */}
                <FeColorMatrix type="saturate" values="0.5" in="displaced" />
              </>
            ) : (
              // Fallback: plain grayscale noise if no image
              <FeColorMatrix type="saturate" values="0" in="noise" />
            )}
            <FeColorMatrix
              in="hue"
              type="matrix"
              values="
              1.6 0 0 0 -0.3
              0 1.6 0 0 -0.3
              0 0 1.6 0 -0.3
              0 0 0 1 0"
              result="final"
            />
          </Filter>
        </Defs>
        <Rect width={width} height={height} filter="url(#colorNoise)" />
      </Svg>
    </Animated.View>
  )
}

export default MapSurfaceNoiseOverlay

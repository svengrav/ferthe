import { Image } from "@app/shared/components"
import { createThemedStyles, useTheme } from "@app/shared/theme"
import { Platform, View } from "react-native"
import { getMapThemeDefaults } from "../../config/mapThemeDefaults"
import { useMapCanvasDimensions, useMapSurface } from "../../stores/mapStore"
import MapSurfaceNoiseOverlay from "./MapSurfaceNoiseOverlay"

/**
 * MapSurface renders the trail map background image.
 * The outer View is clipped to canvas size (overflow hidden).
 * The inner Image is positioned absolutely within canvas pixel space,
 * matching exactly the trail boundary — avoiding oversized layout trees.
 */
function MapSurface() {
  const { styles, theme } = useTheme(useStyles)
  const { image, imageLayout } = useMapSurface()
  const canvasSize = useMapCanvasDimensions()

  return (
    <View
      style={[styles.container, { width: canvasSize.width, height: canvasSize.height }]}
      id="map-surface-image"
    >
      {image && (
        <Image
          source={{ uri: image }}
          width={imageLayout.width}
          height={imageLayout.height}
          style={[styles.image, {
            position: 'absolute',
            left: imageLayout.left,
            top: imageLayout.top,
            backgroundColor: theme.colors.background
          }]}
        />
      )}

      {Platform.OS !== 'web' && (
        <MapSurfaceNoiseOverlay
          width={imageLayout.width}
          height={imageLayout.height}
          left={imageLayout.left}
          top={imageLayout.top}
          imageUrl={image}
        />
      )}
    </View>
  )
}

const { surface } = getMapThemeDefaults()
const useStyles = createThemedStyles(theme => ({
  container: {
    borderRadius: theme.tokens.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.divider,
    zIndex: 0,
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: theme.opacity(theme.colors.background, 0.2),
  },
  image: {
    opacity: surface.imageOpacity,
  },
}))

export default MapSurface
import { Image } from "@app/shared/components"
import { createThemedStyles, useTheme } from "@app/shared/theme"
import { View } from "react-native"
import { getMapThemeDefaults } from "../../config/mapThemeDefaults"
import { useMapCanvasDimensions, useMapSurface } from "../../stores/mapStore"

/**
 * MapSurface renders the trail map background image.
 * The outer View is clipped to canvas size (overflow hidden).
 * The inner Image is positioned absolutely within canvas pixel space,
 * matching exactly the trail boundary — avoiding oversized layout trees.
 */
function MapSurface() {
  const { styles } = useTheme(useStyles)
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
          }]}
        />
      )}
    </View>
  )
}

const { surface } = getMapThemeDefaults()
const useStyles = createThemedStyles(theme => ({
  container: {
    zIndex: 0,
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  image: {
    opacity: surface.imageOpacity,
  },
}))

export default MapSurface
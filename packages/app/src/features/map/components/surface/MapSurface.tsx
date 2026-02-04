import { createThemedStyles } from "@app/shared"
import { Image } from "@app/shared/components"
import { useApp } from "@app/shared/useApp"
import { View } from "react-native"
import { useMapSurface } from "../../stores/mapStore"

const MAP_IMAGE_OPACITY = 0.7

/**
 * MapSurface component renders the map background image with dynamic positioning.
 * Surface layout is calculated in mapApplication and stored in store.
 * Layout position updates automatically when device moves.
 */
function MapSurface() {
  const { styles } = useApp(useStyles)
  const { image, layout } = useMapSurface()

  return (
    <View style={[styles?.inner, {
      left: layout.left,
      top: layout.top,
      width: layout.width,
      height: layout.height,
    }]}>
      {image && (
        <Image
          source={{ uri: image }}
          width={layout.width}
          height={layout.height}
          style={styles?.image}
        />
      )}
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  inner: {
    zIndex: 0,
    position: 'absolute',
  },
  image: {
    opacity: MAP_IMAGE_OPACITY,
  },
}))

export default MapSurface
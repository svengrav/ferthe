import { createThemedStyles } from "@app/shared"
import { Image } from "@app/shared/components"
import { useApp } from "@app/shared/useApp"
import { View } from "react-native"
import { useMapSurface } from "../../stores/mapStore"

const MAP_IMAGE_OPACITY = 0.7

interface MapSurfaceProps {
  children?: React.ReactNode
}

/**
 * MapSurface component renders the map background image with dynamic positioning.
 * Surface layout is calculated in mapApplication and stored in store.
 * Layout position updates automatically when device moves.
 */
function MapSurface(props: MapSurfaceProps) {
  const { children } = props
  const { styles } = useApp(useStyles)
  const { image, layout } = useMapSurface()

  return (
    <View style={styles?.outer}>
      <View style={[styles?.inner, {
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
      }]}>
        {image && (
          <Image
            width={layout.width}
            height={layout.height}
            style={styles?.image}
            source={{ uri: image }}
          />
        )}
        {children}
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  outer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'black',
    borderRadius: 20,
  },
  inner: {
    position: 'absolute',
  },
  image: {
    opacity: MAP_IMAGE_OPACITY,
  },
}))

export default MapSurface
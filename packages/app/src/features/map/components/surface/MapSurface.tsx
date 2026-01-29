import { Image } from "@app/shared/components"
import { GeoBoundary } from "@shared/geo"
import { memo } from "react"
import { View } from "react-native"
import { useMapSurface } from "../../stores/mapStore"

interface MapSurfaceProps {
  children?: React.ReactNode
  boundary: GeoBoundary // Trail boundary
  deviceViewportBoundary: GeoBoundary // Device viewport boundary
}

function MapSurface(props: MapSurfaceProps) {
  const { children } = props
  const { image, layout } = useMapSurface()

  const imageSrc = {
    uri: image || ''
  }

  // Surface layout is calculated in mapApplication and stored in store
  // Layout position updates automatically when device moves
  return (
    <View style={{ flex: 1, overflow: 'hidden', }} id={'map-surface-outer'}>
      <View id={'map-surface-inner'} style={{
        position: 'absolute',
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
        borderRadius: 8,
      }}>
        {imageSrc?.uri && <Image
          width={layout.width}
          height={layout.height}
          style={{ opacity: 0.7 }}
          source={imageSrc}
        />}
        {children}
      </View>
    </View>

  )
}

export default memo(MapSurface)
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
    <View id={'map-surface-inner'} style={{
      position: 'absolute',
      left: layout.left,
      top: layout.top,
      width: layout.width,
      height: layout.height,
      borderRadius: 8,
      backgroundColor: 'rgba(224, 166, 57, 0.7)', // Debug: orange background
    }}>
      {imageSrc?.uri && <Image
        width={layout.width}
        height={layout.height}
        style={{ opacity: 0.7 }}
        source={imageSrc}
      />}
      {children}
    </View>
  )
}

export default memo(MapSurface)
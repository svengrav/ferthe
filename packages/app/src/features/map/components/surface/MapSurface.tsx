import { Image } from "@app/shared/components"
import { memo } from "react"
import { View } from "react-native"
import { useMapSurface } from "../../stores/mapStore"

interface MapSurfaceProps {
  children?: React.ReactNode
}

function MapSurface({ children }: MapSurfaceProps) {
  const { image, layout } = useMapSurface()

  const imageSrc = {
    uri: image || ''
  }

  // Surface layout is calculated in mapApplication and stored in store
  // Layout position updates automatically when device moves
  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: 'black', borderRadius: 20 }} id={'map-surface-outer'}>
      <View id={'map-surface-inner'} style={{
        position: 'absolute',
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
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
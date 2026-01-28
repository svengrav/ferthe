import { GeoBoundary } from "@shared/geo"
import { Image } from "@app/shared/components"
import { memo } from "react"
import { View } from "react-native"
import { useMapCanvas } from "../../stores/mapStore"

// Memoized Map Image Component to prevent unnecessary re-renders
function MapSurface({ boundary }: { boundary?: GeoBoundary }) {
  const { size, image } = useMapCanvas()
  const imageStyle = {
    width: size.width,
    height: size.height,
    borderRadius: 8,
    position: 'absolute' as const
  }
  const imageSrc = {
    uri: image || ''
  }

  return (
    <View style={imageStyle}>
      {imageSrc?.uri && <Image
        width={size.width}
        height={size.height}
        style={{ opacity: 0.7 }}
        source={imageSrc}
      />}

    </View>
  )
}

export default memo(MapSurface)
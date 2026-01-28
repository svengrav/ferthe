import { Image } from "@app/shared/components"
import { GeoBoundary } from "@shared/geo"
import { memo, useMemo } from "react"
import { View } from "react-native"
import { useMapCanvas } from "../../stores/mapStore"
import { useViewportDimensions } from "../../stores/viewportStore"
import { mapUtils } from "../../utils/geoToScreenTransform."
import { MapSurfaceProvider } from "./MapSurfaceContext"

// Memoized Map Image Component to prevent unnecessary re-renders

interface MapSurfaceProps {
  children?: React.ReactNode
  boundary: GeoBoundary // Trail boundary
  deviceViewportBoundary: GeoBoundary // Device viewport boundary
}

function MapSurface(props: MapSurfaceProps) {
  const { children, boundary, deviceViewportBoundary } = props
  const { image } = useMapCanvas()
  const viewportSize = useViewportDimensions()

  // MapSurface represents the boundary passed to it
  // Calculate surface size and position within the viewport
  // The viewport canvas represents deviceViewportBoundary
  // Surface boundary is transformed into viewport coordinates
  const surfaceLayout = useMemo(() => {
    // Top-left corner (NW): northEast.lat, southWest.lon
    const topLeft = mapUtils.coordinatesToPosition(
      { lat: boundary.northEast.lat, lon: boundary.southWest.lon },
      deviceViewportBoundary,
      viewportSize
    )
    // Bottom-right corner (SE): southWest.lat, northEast.lon
    const bottomRight = mapUtils.coordinatesToPosition(
      { lat: boundary.southWest.lat, lon: boundary.northEast.lon },
      deviceViewportBoundary,
      viewportSize
    )

    const width = bottomRight.x - topLeft.x
    const height = bottomRight.y - topLeft.y

    return {
      left: topLeft.x,
      top: topLeft.y,
      width: width,
      height: height,
    }
  }, [boundary, deviceViewportBoundary, viewportSize])

  const imageSrc = {
    uri: image || ''
  }

  // Surface fills exactly the boundary in viewport coordinates
  // Children should position themselves within this surface (0,0 to width,height)
  // using the same boundary for coordinate transformations
  return (
    <MapSurfaceProvider value={{ width: surfaceLayout.width, height: surfaceLayout.height }}>
      <View id={'map-surface-inner'} style={{
        position: 'absolute',
        left: surfaceLayout.left,
        top: surfaceLayout.top,
        width: surfaceLayout.width,
        height: surfaceLayout.height,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 165, 0, 0.2)', // Debug: orange background
      }}>
        {imageSrc?.uri && <Image
          width={surfaceLayout.width}
          height={surfaceLayout.height}
          style={{ opacity: 0.7 }}
          source={imageSrc}
        />}
        {children}
      </View>
    </MapSurfaceProvider>
  )
}

export default memo(MapSurface)
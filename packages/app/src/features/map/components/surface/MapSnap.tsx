import { hexToRgbaWithIntensity } from "@app/shared/utils/colors"
import { GeoBoundary } from "@shared/geo"
import { memo } from "react"
import { useCompensatedScale, useMapSnap, useMapSurfaceLayout } from "../../stores/mapStore"
import { useMapTheme } from "../../stores/mapThemeStore"
import { GeoPath } from "./MapElements"

function MapSnap({ boundary }: { boundary: GeoBoundary }) {
  const scale = useCompensatedScale()
  const { startPoint, endPoint, intensity } = useMapSnap()
  const size = useMapSurfaceLayout()
  const mapTheme = useMapTheme()

  // Don't render if intensity is 0 or if start and end points are the same
  if (intensity === 0) {
    return null
  }

  const color = hexToRgbaWithIntensity(mapTheme.snap.strokeColor || '#ffffff', intensity)
  return <GeoPath
    key={'map-snap-line'}
    boundary={boundary}
    size={size}
    points={[startPoint, endPoint]}
    style={{
      strokeColor: color,
      strokeWidth: mapTheme.snap.strokeWidth,
      strokeDash: mapTheme.snap.strokeDash
    }}
    scale={scale}
  />
}

export default memo(MapSnap)
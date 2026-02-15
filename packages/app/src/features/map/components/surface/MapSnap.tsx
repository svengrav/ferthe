import { hexToRgbaWithIntensity } from "@app/shared/utils/colors"
import { GeoBoundary } from "@shared/geo"
import { memo } from "react"
import { useMapSnap } from "../../stores/mapStore"
import { useMapTheme } from "../../stores/mapThemeStore"
import { GeoPath } from "./MapElements"
import { useCompensatedScale } from "./MapViewport"

interface MapSnapProps {
  boundary: GeoBoundary
  size: { width: number; height: number }
}

function MapSnap({ boundary, size }: MapSnapProps) {
  const { startPoint, endPoint, intensity } = useMapSnap()
  const mapTheme = useMapTheme()
  const scale = useCompensatedScale()

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
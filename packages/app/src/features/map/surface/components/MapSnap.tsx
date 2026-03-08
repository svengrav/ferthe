import { GeoBoundary } from "@shared/geo"
import { memo } from "react"
import { useMapSnap } from "../../stores/mapStore"
import { useMapTheme } from "../../stores/mapThemeStore"
import { useMapCompensatedScale } from "./MapCompensatedScale"
import { GeoPath } from "./MapElements"

interface MapSnapProps {
  boundary: GeoBoundary
  size: { width: number; height: number }
}

function MapSnap({ boundary, size }: MapSnapProps) {
  const { startPoint, endPoint, intensity } = useMapSnap()
  const mapTheme = useMapTheme()
  const scale = useMapCompensatedScale()

  // Don't render if intensity is 0 or if start and end points are the same
  if (intensity === 0) {
    return null
  }

  const color = hexToRgbaWithIntensity(mapTheme.snap.strokeColor, intensity)
  return <GeoPath
    key='map-snap-line'
    boundary={boundary}
    size={size}
    points={[startPoint, endPoint]}
    style={{
      strokeColor: color,
      strokeWidth: mapTheme.snap.strokeWidth,
    }}
    scale={scale}
  />
}

/**
 * Convert a hex color string to an RGBA string with a given intensity.
 * @param hex Hex color string (e.g. "#ff5733")
 * @param intensity Intensity value (0.1 - 1)
 * @returns RGBA color string
 */
const hexToRgbaWithIntensity = (hex: string, intensity: number): string => {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  const alpha = Math.min(1, intensity)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}


export default memo(MapSnap)
import { hexToRgbaWithIntensity } from "@app/shared/utils/colors"
import { memo } from "react"
import { useCompensatedScale, useMapBoundary, useMapSize, useMapSnap } from "../../stores/mapStore"
import { useMapTheme } from "../../stores/mapThemeStore"
import { GeoPath } from "./MapElements"

function MapSnap() {
  const scale = useCompensatedScale()
  const { startPoint, endPoint, intensity } = useMapSnap()
  const boundary = useMapBoundary()
  const size = useMapSize()
  const mapTheme = useMapTheme()
  const color = hexToRgbaWithIntensity(mapTheme.snap.strokeColor || '#ffffff', intensity)
  return <GeoPath
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
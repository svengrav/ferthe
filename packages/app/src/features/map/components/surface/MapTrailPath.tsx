import { memo, useMemo } from 'react'
import { useCompensatedScale, useMapSpots, useMapSurfaceBoundary, useMapSurfaceLayout } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { GeoPath } from './MapElements'

function MapTrailPath() {
  const scale = useCompensatedScale()
  const spots = useMapSpots()
  const boundary = useMapSurfaceBoundary()
  const points = useMemo(() =>
    spots.map(spot => spot.location),
    [spots]
  )
  const size = useMapSurfaceLayout()
  const mapTheme = useMapTheme()

  const pathStyle = {
    strokeColor: mapTheme.trail.strokeColor,
    strokeWidth: mapTheme.trail.strokeWidth,
  }

  return <GeoPath points={points} boundary={boundary} size={size} style={pathStyle} scale={scale} />
}

export default memo(MapTrailPath)

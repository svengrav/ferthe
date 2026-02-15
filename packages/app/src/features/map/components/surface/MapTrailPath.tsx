import { useDiscoverySpots } from '@app/features/discovery/stores/discoveryTrailStore'
import { GeoBoundary } from '@shared/geo'
import { memo, useMemo } from 'react'
import { useMapTheme } from '../../stores/mapThemeStore'
import { GeoPath } from './MapElements'
import { useCompensatedScale } from './MapViewport'

interface MapTrailPathProps {
  boundary: GeoBoundary
  size: { width: number; height: number }
}

function MapTrailPath({ boundary, size }: MapTrailPathProps) {
  const spots = useDiscoverySpots()
  const scale = useCompensatedScale()
  const points = useMemo(() =>
    spots.map(spot => spot.location),
    [spots]
  )
  const mapTheme = useMapTheme()

  const pathStyle = {
    strokeColor: mapTheme.trail.strokeColor,
    strokeWidth: mapTheme.trail.strokeWidth,
  }

  return <GeoPath points={points} boundary={boundary} size={size} style={pathStyle} scale={scale} />
}

export default memo(MapTrailPath)

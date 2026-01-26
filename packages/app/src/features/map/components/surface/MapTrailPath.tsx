import { GeoBoundary } from '@shared/geo'
import { memo, useMemo } from 'react'
import { useCompensatedScale, useMapBoundary, useMapSize, useMapSpots } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { GeoPath } from './MapElements'

export interface MapTrailPathProps {
  boundary?: GeoBoundary
  canvasSize?: { width: number; height: number }
  compensatedScale?: number
}

/**
 * Component that renders the trail path connecting spots
 * @param props.boundary - Optional boundary override (uses store if not provided)
 * @param props.canvasSize - Optional canvas size override (uses store if not provided)
 * @param props.compensatedScale - Optional scale override for stroke width compensation
 */
function MapTrailPath({ boundary: propBoundary, canvasSize: propCanvasSize, compensatedScale: propScale }: MapTrailPathProps = {}) {
  const storeScale = useCompensatedScale()
  const spots = useMapSpots()
  const points = useMemo(() =>
    spots.map(spot => spot.location),
    [spots]
  )
  const storeBoundary = useMapBoundary()
  const storeSize = useMapSize()
  const mapTheme = useMapTheme()

  // Use props if provided, otherwise fall back to store
  const boundary = propBoundary ?? storeBoundary
  const size = propCanvasSize ?? storeSize
  const scale = propScale ?? storeScale

  const pathStyle = {
    strokeColor: mapTheme.trail.strokeColor,
    strokeWidth: mapTheme.trail.strokeWidth,
  }

  return <GeoPath points={points} boundary={boundary} size={size} style={pathStyle} scale={scale} />
}

export default memo(MapTrailPath)

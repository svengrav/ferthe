import { GeoBoundary, GeoLocation } from '@shared/geo/'
import { memo } from 'react'
import { useMapCanvas, useMapRadius } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { GeoMarker } from './MapElements'

const DEFAULT_STROKE_COLOR = 'rgba(44, 42, 165, 0.295)'
const DEFAULT_FILL_COLOR = 'rgba(67, 70, 255, 0.267)'
const TRANSPARENT_FILL = 'none'


/**
 * Component that renders concentric circles for inner and outer radius visualization
 */
function MapRadius({ boundary }: { boundary: GeoBoundary }) {
  const { center, radius, innerRadius } = useMapRadius()
  const { size } = useMapCanvas()

  const mapTheme = useMapTheme()
  // Style configurations for inner and outer markers
  const innerMarkerStyle = {
    strokeColor: mapTheme.radius.strokeColor || DEFAULT_STROKE_COLOR,
    fill: TRANSPARENT_FILL,
  }

  const outerMarkerStyle = {
    strokeColor: mapTheme.radius.strokeColor || DEFAULT_STROKE_COLOR,
    fill: mapTheme.radius.fill || DEFAULT_FILL_COLOR,
  }

  return (
    <>
      {/* Inner radius marker - transparent fill */}
      <GeoMarker
        location={center as GeoLocation}
        boundary={boundary}
        size={size}
        radius={innerRadius}
        style={innerMarkerStyle}
      />

      {/* Outer radius marker - with fill */}
      <GeoMarker
        location={center as GeoLocation}
        boundary={boundary}
        size={size}
        radius={radius}
        style={outerMarkerStyle}
      />
    </>
  )
}

export default memo(MapRadius)

import { GeoLocation } from '@shared/geo'
import { memo } from 'react'
import { Text, View } from 'react-native'
import { useMapBoundary, useMapCanvas, useMapSpots, useMapViewport } from '../../stores/mapStore'
import { GeoMarker } from './MapElements'

/**
 * Dev-only component to visualize map boundaries
 * - Red dots: Actual spot positions
 * - Green: Canvas Boundary (1000x1000px map surface)
 * - Blue: Viewport Boundary (visible device screen area)
 * - Yellow: Trail Boundary corners (should encompass all red dots)
 */
function MapDebugBoundaries() {
  const boundary = useMapBoundary()
  const canvas = useMapCanvas()
  const viewport = useMapViewport()
  const spots = useMapSpots()

  // Calculate viewport rectangle in canvas coordinates (absolute positioning)
  const viewportRect = {
    left: (canvas.size.width - viewport.width) / 2,
    top: (canvas.size.height - viewport.height) / 2,
    width: viewport.width,
    height: viewport.height,
  }

  // Debug info
  const latSpan = Math.abs(boundary.northEast.lat - boundary.southWest.lat).toFixed(6)
  const lonSpan = Math.abs(boundary.northEast.lon - boundary.southWest.lon).toFixed(6)
  const neLat = boundary.northEast.lat.toFixed(6)
  const neLon = boundary.northEast.lon.toFixed(6)
  const swLat = boundary.southWest.lat.toFixed(6)
  const swLon = boundary.southWest.lon.toFixed(6)

  // Calculate actual spot bounds for comparison
  let spotMinLat = Infinity, spotMaxLat = -Infinity
  let spotMinLon = Infinity, spotMaxLon = -Infinity
  spots.forEach(s => {
    spotMinLat = Math.min(spotMinLat, s.location.lat)
    spotMaxLat = Math.max(spotMaxLat, s.location.lat)
    spotMinLon = Math.min(spotMinLon, s.location.lon)
    spotMaxLon = Math.max(spotMaxLon, s.location.lon)
  })

  // Log for debugging
  console.log('MapDebugBoundaries:', {
    boundary: { ne: boundary.northEast, sw: boundary.southWest },
    spotBounds: {
      minLat: spotMinLat, maxLat: spotMaxLat,
      minLon: spotMinLon, maxLon: spotMaxLon
    },
    spotCount: spots.length
  })

  const spotLatSpan = (spotMaxLat - spotMinLat).toFixed(6)
  const spotLonSpan = (spotMaxLon - spotMinLon).toFixed(6)

  // Calculate padding (difference between boundary and actual spots)
  const paddingNorth = (boundary.northEast.lat - spotMaxLat).toFixed(6)
  const paddingSouth = (spotMinLat - boundary.southWest.lat).toFixed(6)
  const paddingEast = (boundary.northEast.lon - spotMaxLon).toFixed(6)
  const paddingWest = (spotMinLon - boundary.southWest.lon).toFixed(6)

  // Trail Boundary corners as visual markers
  const boundaryCorners: GeoLocation[] = [
    { lat: boundary.northEast.lat, lon: boundary.southWest.lon }, // NW
    { lat: boundary.northEast.lat, lon: boundary.northEast.lon }, // NE
    { lat: boundary.southWest.lat, lon: boundary.northEast.lon }, // SE
    { lat: boundary.southWest.lat, lon: boundary.southWest.lon }, // SW
  ]

  return (
    <>
      {/* Canvas Boundary - Full map surface */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: canvas.size.width,
          height: canvas.size.height,
          borderWidth: 2,
          borderColor: '#00ff00',
          pointerEvents: 'none',
        }}
      />

      {/* Viewport Boundary - Screen area overlay */}
      <View
        style={{
          position: 'absolute',
          left: viewportRect.left,
          top: viewportRect.top,
          width: viewportRect.width,
          height: viewportRect.height,
          borderWidth: 2,
          borderColor: '#0000ff',
          borderStyle: 'dashed',
          pointerEvents: 'none',
        }}
      />

      {/* Trail Boundary Corners - Yellow markers */}
      {boundaryCorners.map((corner, idx) => (
        <GeoMarker
          key={`corner-${idx}`}
          location={corner}
          boundary={boundary}
          size={canvas.size}
          radius={15}
          style={{
            strokeColor: '#ffff00',
            fill: 'rgba(255, 255, 0, 0.3)',
          }}
        />
      ))}

      {/* Actual Spots - Red dots */}
      {spots.map((spot, idx) => (
        <GeoMarker
          key={`spot-${idx}`}
          location={spot.location}
          boundary={boundary}
          size={canvas.size}
          radius={8}
          style={{
            strokeColor: '#ff0000',
            fill: 'rgba(255, 0, 0, 0.5)',
          }}
        />
      ))}

      {/* Debug Label */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'rgba(0,0,0,0.9)',
          padding: 8,
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
          Trail Boundary:
        </Text>
        <Text style={{ color: '#ffff00', fontSize: 9 }}>
          NE: {neLat}, {neLon}
        </Text>
        <Text style={{ color: '#ffff00', fontSize: 9 }}>
          SW: {swLat}, {swLon}
        </Text>
        <Text style={{ color: '#ffff00', fontSize: 9, marginBottom: 4 }}>
          Δlat={latSpan}° Δlon={lonSpan}°
        </Text>
        <Text style={{ color: '#ff6600', fontSize: 9, fontWeight: 'bold', marginBottom: 2 }}>
          Actual Spot Span:
        </Text>
        <Text style={{ color: '#ff6600', fontSize: 9 }}>
          Δlat={spotLatSpan}° Δlon={spotLonSpan}°
        </Text>
        <Text style={{ color: '#00ffff', fontSize: 9, fontWeight: 'bold', marginTop: 4, marginBottom: 2 }}>
          Padding (degrees):
        </Text>
        <Text style={{ color: '#00ffff', fontSize: 8 }}>
          N:{paddingNorth} S:{paddingSouth}
        </Text>
        <Text style={{ color: '#00ffff', fontSize: 8, marginBottom: 4 }}>
          E:{paddingEast} W:{paddingWest}
        </Text>
        <Text style={{ color: '#ff0000', fontSize: 9 }}>
          Red: Spots ({spots.length})
        </Text>
        <Text style={{ color: '#ffff00', fontSize: 9 }}>
          Yellow: Boundary corners
        </Text>
        <Text style={{ color: '#00ff00', fontSize: 9 }}>
          Green: Canvas {canvas.size.width}x{canvas.size.height}
        </Text>
        <Text style={{ color: '#0000ff', fontSize: 9 }}>
          Blue: Viewport {viewport.width}x{viewport.height}
        </Text>
      </View>
    </>
  )
}

export default memo(MapDebugBoundaries)

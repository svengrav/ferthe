import { DiscoverySpot } from '@shared/contracts'
import { GeoBoundary } from '@shared/geo'
import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useViewportContext, useViewportDimensions, useViewportValues } from '../stores/viewportStore'
import { mapUtils } from '../utils/geoToScreenTransform.'

interface MapDebugData {
  spots: DiscoverySpot[]
  trailBoundary: GeoBoundary | null
}

interface MapMetrics {
  spotCount: number
  trailWidthDegrees: number | null
  trailHeightDegrees: number | null
  trailWidthMeters: number | null
  trailHeightMeters: number | null
  deviceViewportWidthDegrees: number
  deviceViewportHeightDegrees: number
  deviceViewportWidthMeters: number
  deviceViewportHeightMeters: number
  spotsInViewport: number
  metersPerPixel: number
  scale: number
  radiusMeters: number
}

/**
 * Hook to calculate map-specific debug metrics
 */
const useMapDebug = (data: MapDebugData): MapMetrics => {
  const { spots, trailBoundary } = data
  const { deviceLocation, boundary: deviceViewportBoundary, radiusMeters } = useViewportContext()
  const viewportSize = useViewportDimensions()
  const { scale } = useViewportValues()

  // Calculate trail dimensions in degrees
  const trailWidthDegrees = trailBoundary
    ? trailBoundary.northEast.lon - trailBoundary.southWest.lon
    : null
  const trailHeightDegrees = trailBoundary
    ? trailBoundary.northEast.lat - trailBoundary.southWest.lat
    : null

  // Calculate trail dimensions in meters
  const trailWidthMeters = trailBoundary && trailWidthDegrees !== null
    ? trailWidthDegrees * 111000 * Math.cos((deviceLocation.lat * Math.PI) / 180)
    : null
  const trailHeightMeters = trailHeightDegrees !== null
    ? trailHeightDegrees * 111000
    : null

  // Calculate device viewport dimensions in degrees
  const deviceViewportWidthDegrees = deviceViewportBoundary.northEast.lon - deviceViewportBoundary.southWest.lon
  const deviceViewportHeightDegrees = deviceViewportBoundary.northEast.lat - deviceViewportBoundary.southWest.lat

  // Calculate device viewport dimensions in meters
  const deviceViewportWidthMeters = deviceViewportWidthDegrees * 111000 * Math.cos((deviceLocation.lat * Math.PI) / 180)
  const deviceViewportHeightMeters = deviceViewportHeightDegrees * 111000

  // Calculate meters per pixel
  const metersPerPixel = (radiusMeters * 2) / viewportSize.width

  // Count spots in viewport
  const spotsInViewport = spots.filter(spot => {
    const inLat = spot.location.lat >= deviceViewportBoundary.southWest.lat &&
      spot.location.lat <= deviceViewportBoundary.northEast.lat
    const inLon = spot.location.lon >= deviceViewportBoundary.southWest.lon &&
      spot.location.lon <= deviceViewportBoundary.northEast.lon
    return inLat && inLon
  }).length

  // Console logging (debounced)
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)

    logTimeoutRef.current = setTimeout(() => {
      console.group('🗺️ Map Debug Info')
      console.log('Viewport Size:', viewportSize)
      console.log('Device:', `${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lon.toFixed(5)}`)
      console.log('Spots:', {
        total: spots.length,
        inViewport: spotsInViewport,
      })
      console.log('Device Viewport:', {
        degrees: `${deviceViewportWidthDegrees.toFixed(6)}° × ${deviceViewportHeightDegrees.toFixed(6)}°`,
        meters: `${deviceViewportWidthMeters.toFixed(1)}m × ${deviceViewportHeightMeters.toFixed(1)}m`,
        radius: `${radiusMeters}m`,
        metersPerPixel: metersPerPixel.toFixed(2),
        scale: scale.toFixed(2),
      })
      if (trailBoundary) {
        console.log('Trail Boundary:', {
          degrees: `${trailWidthDegrees?.toFixed(6)}° × ${trailHeightDegrees?.toFixed(6)}°`,
          meters: `${trailWidthMeters?.toFixed(1)}m × ${trailHeightMeters?.toFixed(1)}m`,
        })
      }
      console.groupEnd()
    }, 500)

    return () => {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)
    }
  }, [
    spots.length,
    spotsInViewport,
    trailWidthDegrees,
    trailHeightDegrees,
    trailWidthMeters,
    trailHeightMeters,
    deviceViewportWidthDegrees,
    deviceViewportHeightDegrees,
    deviceViewportWidthMeters,
    deviceViewportHeightMeters,
  ])

  return {
    spotCount: spots.length,
    trailWidthDegrees,
    trailHeightDegrees,
    trailWidthMeters,
    trailHeightMeters,
    metersPerPixel,
    scale,
    radiusMeters,
    deviceViewportWidthDegrees,
    deviceViewportHeightDegrees,
    deviceViewportWidthMeters,
    deviceViewportHeightMeters,
    spotsInViewport,
  }
}

/**
 * MapDebug Component
 * 
 * Displays map-specific debug information overlay
 * - Spot markers
 * - Trail boundary visualization
 * - Device viewport boundary
 * - Real-time map metrics
 */
export function MapDebug(props: MapDebugData) {
  const metrics = useMapDebug(props)
  const { spots, trailBoundary } = props
  const { boundary: deviceViewportBoundary } = useViewportContext()
  const viewportSize = useViewportDimensions()

  if (!trailBoundary) return;

  // Convert spots to screen positions
  const spotPositions = spots.map(spot => ({
    ...spot,
    screenPos: mapUtils.coordinatesToPosition(spot.location, deviceViewportBoundary, viewportSize)
  }))

  const surfaceLayout = useMemo(() => {
    // Top-left corner (NW): northEast.lat, southWest.lon
    const topLeft = mapUtils.coordinatesToPosition(
      { lat: trailBoundary.northEast.lat, lon: trailBoundary.southWest.lon },
      deviceViewportBoundary,
      viewportSize
    )
    // Bottom-right corner (SE): southWest.lat, northEast.lon
    const bottomRight = mapUtils.coordinatesToPosition(
      { lat: trailBoundary.southWest.lat, lon: trailBoundary.northEast.lon },
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
  }, [trailBoundary, deviceViewportBoundary, viewportSize])

  // Calculate trail boundary screen position and size
  const trailBoundaryBox = trailBoundary ? (() => {
    const topLeft = mapUtils.coordinatesToPosition(
      { lat: trailBoundary.northEast.lat, lon: trailBoundary.southWest.lon },
      deviceViewportBoundary,
      viewportSize
    )
    const bottomRight = mapUtils.coordinatesToPosition(
      { lat: trailBoundary.southWest.lat, lon: trailBoundary.northEast.lon },
      deviceViewportBoundary,
      viewportSize
    )
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }
  })() : null

  return (
    <View style={styles.debugContainer} pointerEvents="none">
      {/* Trail boundary box (if exists) */}
      {trailBoundary && trailBoundaryBox && (
        <View style={[
          styles.trailBoundaryBox,
          {
            left: trailBoundaryBox.left,
            top: trailBoundaryBox.top,
            width: trailBoundaryBox.width,
            height: trailBoundaryBox.height,
          }
        ]}>
          <Text style={styles.trailBoundaryLabel}>Trail Boundary</Text>
        </View>
      )}

      {/* Device viewport boundary indicator */}
      <View style={styles.viewportIndicator}>
        <Text style={styles.viewportLabel}>Device Viewport (1km)</Text>
      </View>

      {/* Spot markers */}
      {spotPositions.map((spot, index) => (
        <View
          key={spot.id || index}
          style={[
            styles.spotMarker,
            {
              left: spot.screenPos.x - 6,
              top: spot.screenPos.y - 6,
            }
          ]}
        >
          <View style={styles.spotDot} />
        </View>
      ))}

      {/* Info Box */}
      <View style={styles.infoBox}>
        {trailBoundary && (
          <>
            <Text style={styles.infoTitle}>MAP DEBUG</Text>
            <Text style={styles.infoText}>
              Center: {((trailBoundary.northEast.lat + trailBoundary.southWest.lat) / 2).toFixed(5)}, {((trailBoundary.northEast.lon + trailBoundary.southWest.lon) / 2).toFixed(5)}
            </Text>
            <Text style={styles.infoText}>Viewport: {viewportSize.width}×{viewportSize.height}px</Text>
            <Text style={styles.infoText}>Scale: {metrics.scale.toFixed(2)}x</Text>
            <Text style={styles.infoText}>Radius: {metrics.radiusMeters}m</Text>
            <Text style={styles.infoText}>m/px: {metrics.metersPerPixel.toFixed(2)}</Text>
            <Text style={styles.infoText}>
              Spots: {metrics.spotCount} (in viewport: {metrics.spotsInViewport})
            </Text>
            <Text style={[styles.infoText]}>
              Viewport: {metrics.deviceViewportWidthMeters.toFixed(0)}m × {metrics.deviceViewportHeightMeters.toFixed(0)}m
            </Text>
            <Text style={styles.infoText}>
              Viewport: {metrics.deviceViewportWidthDegrees.toFixed(6)}° × {metrics.deviceViewportHeightDegrees.toFixed(6)}°
            </Text>
            <Text style={[styles.infoText]}>
              Boundary: {metrics.trailWidthMeters?.toFixed(0)}m × {metrics.trailHeightMeters?.toFixed(0)}m
            </Text>
            <Text style={styles.infoText}>
              Boundary: {metrics.trailWidthDegrees?.toFixed(6)}° × {metrics.trailHeightDegrees?.toFixed(6)}°
            </Text>
            <Text style={styles.infoText}>
              Boundary: {surfaceLayout.width.toFixed(0)}px × {surfaceLayout.height.toFixed(0)}px
            </Text>

          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8888,
  },
  trailBoundaryBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(128, 0, 128, 0.6)',
    borderStyle: 'dashed',
  },
  trailBoundaryLabel: {
    position: 'absolute',
    top: -12,
    left: 5,
    fontSize: 10,
    color: 'rgba(128, 0, 128, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: 'monospace',
  },
  viewportIndicator: {
    position: 'absolute',
    top: 50,
    right: 10,
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.6)',
    borderRadius: 4,
  },
  viewportLabel: {
    fontSize: 10,
    color: 'rgba(0, 255, 0, 0.8)',
    fontFamily: 'monospace',
  },
  spotMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 0, 0.6)',
  },
  infoBox: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.6)',
    minWidth: 200,
  },
  infoTitle: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  infoText: {
    color: '#00ff00',
    fontSize: 10,
    fontFamily: 'monospace',
    marginVertical: 1,
  },
})

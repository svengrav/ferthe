import { getAppContext } from '@app/appContext'
import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  useMapSpots,
  useMapSurfaceBoundary,
  useSetTappedSpot,
  useViewportContext,
  useViewportDimensions,
  useViewportValues
} from '../../stores/mapStore'
import { mapUtils } from '../../utils/geoToScreenTransform.'

interface DebugMetrics {
  // Viewport metrics
  metersPerPixel: number
  pixelRatio: number
  viewportBoundaryWidth: number
  viewportBoundaryHeight: number
  viewportWidthMeters: number
  viewportHeightMeters: number
  currentScale: number
  currentTranslation: { x: number; y: number }

  // Map metrics
  spotCount: number
  spotsInViewport: number
  trailWidthDegrees: number | null
  trailHeightDegrees: number | null
  trailWidthMeters: number | null
  trailHeightMeters: number | null
  surfaceLayout: {
    left: number
    top: number
    width: number
    height: number
  } | null
}

/**
 * Hook to calculate consolidated debug metrics
 */
const useDebugMetrics = (): DebugMetrics => {
  const { boundary: viewportBoundary, radiusMeters, deviceLocation } = useViewportContext()
  const viewportSize = useViewportDimensions()
  const { scale, translationX, translationY } = useViewportValues()
  const spots = useMapSpots()
  const trailBoundary = useMapSurfaceBoundary()

  // Viewport calculations
  const viewportBoundaryWidth = viewportBoundary.northEast.lon - viewportBoundary.southWest.lon
  const viewportBoundaryHeight = viewportBoundary.northEast.lat - viewportBoundary.southWest.lat
  const viewportWidthMeters = viewportBoundaryWidth * 111000 * Math.cos((deviceLocation.lat * Math.PI) / 180)
  const viewportHeightMeters = viewportBoundaryHeight * 111000
  const metersPerPixel = (radiusMeters * 2) / viewportSize.width

  // Trail/Map calculations
  const trailWidthDegrees = trailBoundary ? trailBoundary.northEast.lon - trailBoundary.southWest.lon : null
  const trailHeightDegrees = trailBoundary ? trailBoundary.northEast.lat - trailBoundary.southWest.lat : null
  const trailWidthMeters = trailWidthDegrees !== null ? trailWidthDegrees * 111000 * Math.cos((deviceLocation.lat * Math.PI) / 180) : null
  const trailHeightMeters = trailHeightDegrees !== null ? trailHeightDegrees * 111000 : null

  // Surface layout calculation
  const surfaceLayout = useMemo(() => {
    if (!trailBoundary) return null

    const topLeft = mapUtils.coordinatesToPosition(
      { lat: trailBoundary.northEast.lat, lon: trailBoundary.southWest.lon },
      viewportBoundary,
      viewportSize
    )
    const bottomRight = mapUtils.coordinatesToPosition(
      { lat: trailBoundary.southWest.lat, lon: trailBoundary.northEast.lon },
      viewportBoundary,
      viewportSize
    )

    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }
  }, [trailBoundary, viewportBoundary, viewportSize])

  // Spots in viewport
  const spotsInViewport = spots.filter(spot => {
    const inLat = spot.location.lat >= viewportBoundary.southWest.lat && spot.location.lat <= viewportBoundary.northEast.lat
    const inLon = spot.location.lon >= viewportBoundary.southWest.lon && spot.location.lon <= viewportBoundary.northEast.lon
    return inLat && inLon
  }).length

  // Consolidated console logging
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)

    logTimeoutRef.current = setTimeout(() => {
      console.group('🗺️ Map Debug (Consolidated)')
      console.log('📍 Device:', `${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lon.toFixed(5)}`)
      console.log('📐 Viewport:', {
        size: `${viewportSize.width}×${viewportSize.height}px`,
        radius: `${radiusMeters}m`,
        degrees: `${viewportBoundaryWidth.toFixed(6)}° × ${viewportBoundaryHeight.toFixed(6)}°`,
        meters: `${viewportWidthMeters.toFixed(1)}m × ${viewportHeightMeters.toFixed(1)}m`,
        metersPerPixel: metersPerPixel.toFixed(2),
      })
      console.log('🔍 Transform:', {
        scale: scale.toFixed(2),
        offset: `${translationX.toFixed(0)}, ${translationY.toFixed(0)}`,
      })
      if (trailBoundary && surfaceLayout) {
        console.log('🗺️ Trail/Surface:', {
          degrees: `${trailWidthDegrees?.toFixed(6)}° × ${trailHeightDegrees?.toFixed(6)}°`,
          meters: `${trailWidthMeters?.toFixed(1)}m × ${trailHeightMeters?.toFixed(1)}m`,
          pixels: `${surfaceLayout.width.toFixed(0)}×${surfaceLayout.height.toFixed(0)}px`,
        })
      }
      console.log('📌 Spots:', {
        total: spots.length,
        inViewport: spotsInViewport,
      })
      console.groupEnd()
    }, 500)

    return () => {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)
    }
  }, [
    viewportSize.width,
    viewportSize.height,
    radiusMeters,
    scale,
    translationX,
    translationY,
    spots.length,
    spotsInViewport,
    trailWidthMeters,
    trailHeightMeters,
  ])

  return {
    metersPerPixel,
    pixelRatio: viewportSize.width / (radiusMeters * 2),
    viewportBoundaryWidth,
    viewportBoundaryHeight,
    viewportWidthMeters,
    viewportHeightMeters,
    currentScale: scale,
    currentTranslation: { x: translationX, y: translationY },
    spotCount: spots.length,
    spotsInViewport,
    trailWidthDegrees,
    trailHeightDegrees,
    trailWidthMeters,
    trailHeightMeters,
    surfaceLayout,
  }
}

/**
 * MapViewportDebug Component
 * 
 * Consolidated debug overlay for viewport and map
 * - Viewport boundaries and transforms
 * - Trail/surface visualization
 * - Spot markers
 * - Interactive tap-to-teleport (dev only)
 * - Real-time metrics display
 * - Console logging
 */
export function MapViewportDebug() {
  const metrics = useDebugMetrics()
  const { boundary: viewportBoundary, radiusMeters, deviceLocation } = useViewportContext()
  const viewportSize = useViewportDimensions()
  const { scale, translationX, translationY } = useViewportValues()
  const spots = useMapSpots()
  const trailBoundary = useMapSurfaceBoundary()
  const setTappedSpot = useSetTappedSpot()
  const { sensorApplication } = getAppContext()
  const viewRef = useRef<View>(null)
  const touchStartTimeRef = useRef<number | null>(null)

  // Spot screen positions
  const spotPositions = useMemo(() =>
    spots.map(spot => ({
      ...spot,
      screenPos: mapUtils.coordinatesToPosition(spot.location, viewportBoundary, viewportSize)
    })),
    [spots, viewportBoundary, viewportSize]
  )

  // Trail boundary box
  const trailBoundaryBox = useMemo(() => {
    if (!trailBoundary) return null
    const topLeft = mapUtils.coordinatesToPosition(
      { lat: trailBoundary.northEast.lat, lon: trailBoundary.southWest.lon },
      viewportBoundary,
      viewportSize
    )
    const bottomRight = mapUtils.coordinatesToPosition(
      { lat: trailBoundary.southWest.lat, lon: trailBoundary.northEast.lon },
      viewportBoundary,
      viewportSize
    )
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }
  }, [trailBoundary, viewportBoundary, viewportSize])

  // Styles
  const staticBorderStyle = { width: viewportSize.width, height: viewportSize.height }
  const transformedBorderStyle = {
    width: viewportSize.width * scale,
    height: viewportSize.height * scale,
    transform: [{ translateX: translationX }, { translateY: translationY }]
  }
  const scaledWidth = viewportSize.width * scale
  const scaledHeight = viewportSize.height * scale

  return (
    <View
      ref={viewRef}
      style={styles.debugContainer}
      id="map-viewport-debug-overlay"
      pointerEvents='box-none'
    >
      {/* Viewport border (static) */}
      <View style={[styles.viewportBorder, staticBorderStyle]} />

      {/* Transformed area border */}
      <View style={[styles.transformedBorder, transformedBorderStyle]} />

      {/* Trail boundary box */}
      {trailBoundary && trailBoundaryBox && (
        <View style={[styles.trailBoundaryBox, trailBoundaryBox]}>
          <Text style={styles.trailBoundaryLabel}>Trail Boundary</Text>
        </View>
      )}

      {/* Spot markers */}
      {spotPositions.map((spot, i) => (
        <View key={spot.id || i} style={[styles.spotMarker, {
          left: spot.screenPos.x - 6,
          top: spot.screenPos.y - 6
        }]}>
          <View style={styles.spotDot} />
        </View>
      ))}

      {/* Center crosshair (device) */}
      <View style={styles.centerMarker}>
        <View style={styles.horizontalLine} />
        <View style={styles.verticalLine} />
      </View>

      {/* Grid */}
      <View style={[styles.gridContainer, staticBorderStyle]} pointerEvents="none">
        {[...Array(5)].map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              { top: (viewportSize.height / 4) * i, width: viewportSize.width },
            ]}
          />
        ))}
        {[...Array(5)].map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              { left: (viewportSize.width / 4) * i, height: viewportSize.height },
            ]}
          />
        ))}
      </View>

      {/* Viewport Info Box (top-left) */}
      <View style={styles.viewportInfoBox} pointerEvents="none">
        <Text style={styles.infoTitle}>VIEWPORT</Text>
        <Text style={styles.infoText}>Device: {deviceLocation.lat.toFixed(5)}, {deviceLocation.lon.toFixed(5)}</Text>
        <Text style={styles.infoText}>Size: {viewportSize.width}×{viewportSize.height}px</Text>
        <Text style={styles.infoText}>Scaled: {scaledWidth.toFixed(0)}×{scaledHeight.toFixed(0)}px</Text>
        <Text style={styles.infoText}>Radius: {radiusMeters}m</Text>
        <Text style={styles.infoText}>m/px: {metrics.metersPerPixel.toFixed(2)}</Text>
        <Text style={styles.infoText}>Scale: {metrics.currentScale.toFixed(2)}x</Text>
        <Text style={styles.infoText}>Offset: {metrics.currentTranslation.x.toFixed(0)}, {metrics.currentTranslation.y.toFixed(0)}</Text>
        <Text style={styles.infoText}>
          Viewport: {metrics.viewportWidthMeters.toFixed(0)}m × {metrics.viewportHeightMeters.toFixed(0)}m
        </Text>
      </View>

      {/* Map Info Box (bottom-left) */}
      {trailBoundary && metrics.surfaceLayout && (
        <View style={styles.mapInfoBox} pointerEvents="none">
          <Text style={styles.infoTitle}>MAP/TRAIL</Text>
          <Text style={styles.infoText}>
            Center: {((trailBoundary.northEast.lat + trailBoundary.southWest.lat) / 2).toFixed(5)},
            {((trailBoundary.northEast.lon + trailBoundary.southWest.lon) / 2).toFixed(5)}
          </Text>
          <Text style={styles.infoText}>
            Boundary: {metrics.trailWidthMeters?.toFixed(0)}m × {metrics.trailHeightMeters?.toFixed(0)}m
          </Text>
          <Text style={styles.infoText}>
            Surface: {metrics.surfaceLayout.width.toFixed(0)}×{metrics.surfaceLayout.height.toFixed(0)}px
          </Text>
          <Text style={styles.infoText}>
            Spots: {metrics.spotCount} (in view: {metrics.spotsInViewport})
          </Text>
        </View>
      )}

      {/* Corner markers */}
      <View style={[styles.cornerMarker, styles.topLeft]} pointerEvents="none" />
      <View style={[styles.cornerMarker, styles.topRight]} pointerEvents="none" />
      <View style={[styles.cornerMarker, styles.bottomLeft]} pointerEvents="none" />
      <View style={[styles.cornerMarker, styles.bottomRight]} pointerEvents="none" />
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  viewportBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(0, 150, 255, 0.7)',
    borderStyle: 'dashed',
    pointerEvents: 'none',
  },
  transformedBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 150, 0, 0.8)',
    borderStyle: 'solid',
    pointerEvents: 'none',
  },
  trailBoundaryBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(128, 0, 128, 0.7)',
    borderStyle: 'dashed',
    pointerEvents: 'none',
  },
  trailBoundaryLabel: {
    position: 'absolute',
    top: -14,
    left: 4,
    fontSize: 10,
    color: 'rgba(200, 100, 200, 0.9)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: 'monospace',
  },
  spotMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  spotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 50, 50, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 0, 0.8)',
  },
  gridContainer: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  gridLine: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 200, 200, 0.15)',
    pointerEvents: 'none',
  },
  centerMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  horizontalLine: {
    position: 'absolute',
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 255, 0, 0.9)',
  },
  verticalLine: {
    position: 'absolute',
    width: 2,
    height: 30,
    backgroundColor: 'rgba(255, 255, 0, 0.9)',
  },
  cornerMarker: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderColor: 'rgba(255, 0, 0, 0.7)',
    borderWidth: 2,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  viewportInfoBox: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 150, 255, 0.6)',
    minWidth: 220,
  },
  mapInfoBox: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(128, 0, 128, 0.6)',
    minWidth: 220,
  },
  infoTitle: {
    color: '#00ffff',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  infoText: {
    color: '#00ff00',
    fontSize: 9,
    fontFamily: 'monospace',
    marginVertical: 0.5,
  },
})

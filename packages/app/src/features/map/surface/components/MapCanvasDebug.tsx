import { useDiscoverySpotsViewModel } from '@app/features/discovery/hooks/useDiscoverySpotsViewModel'
import { logger } from '@app/shared/utils/logger'
import { geoUtils } from '@shared/geo'
import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import {
  useMapCanvasContext,
  useMapCanvasDimensions,
  useMapCanvasValues,
  useMapSurface,
  useMapSurfaceBoundary,
  useMapSurfaceLayout
} from '../../stores/mapStore'
import { mapUtils } from '../../services/geoToScreenTransform'

interface DebugMetrics {
  // Viewport metrics
  metersPerPixel: number
  pixelRatio: number
  viewport: {
    degrees: { width: number; height: number }
    meters: { width: number; height: number }
  }
  currentScale: number
  currentTranslation: { x: number; y: number }

  // Map/Trail metrics
  trail: {
    degrees: { width: number; height: number } | null
    meters: { width: number; height: number } | null
  }
  spots: {
    total: number
    inViewport: number
  }
  surface: {
    layout: { left: number; top: number; width: number; height: number } | null
  }
}

/**
 * Hook to calculate consolidated debug metrics from store data and geoUtils
 * Aggregates all viewport, trail, spot and surface metrics in one structured object
 */
const useDebugMetrics = (): DebugMetrics => {
  const { boundary: viewportBoundary, radiusMeters, deviceLocation } = useMapCanvasContext()
  const viewportSize = useMapCanvasDimensions()
  const { scale, translationX, translationY } = useMapCanvasValues()
  const surfaceLayout = useMapSurfaceLayout()
  const spots = useDiscoverySpotsViewModel()
  const trailBoundary = useMapSurfaceBoundary()

  // Calculate dimensions using geoUtils (consolidates degree/meter conversions)
  const viewportDims = useMemo(
    () => geoUtils.calculateBoundaryDimensions(viewportBoundary, deviceLocation.lat),
    [viewportBoundary, deviceLocation.lat]
  )

  const trailDims = useMemo(
    () => (trailBoundary ? geoUtils.calculateBoundaryDimensions(trailBoundary, deviceLocation.lat) : null),
    [trailBoundary, deviceLocation.lat]
  )

  // Filter spots in viewport
  const spotsInViewport = useMemo(
    () => spots.filter(spot => geoUtils.isCoordinateInBounds(spot.location, viewportBoundary)).length,
    [spots, viewportBoundary]
  )

  // Consolidated console logging with 500ms debounce
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)

    logTimeoutRef.current = setTimeout(() => {
      logger.group('🗺️ Map Debug (Consolidated)')
      logger.log('Device:', `${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lon.toFixed(5)}`)
      logger.log('Viewport:', {
        size: `${viewportSize.width}×${viewportSize.height}px`,
        radius: `${radiusMeters}m`,
        degrees: viewportDims.degrees,
        meters: viewportDims.meters,
      })
      logger.log('Trail:', { degrees: trailDims?.degrees, meters: trailDims?.meters })
      logger.log('Transform:', {
        scale: scale.toFixed(2),
        offset: `${translationX.toFixed(0)}, ${translationY.toFixed(0)}`,
      })
      logger.log('Spots:', {
        total: spots.length,
        inViewport: spotsInViewport,
      })
      logger.groupEnd()
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
    viewportDims,
    trailDims,
    deviceLocation.lat,
    deviceLocation.lon,
  ])

  // Compute derived metrics
  const metersPerPixel = radiusMeters * 2 / viewportSize.width

  return {
    metersPerPixel,
    pixelRatio: viewportSize.width / (radiusMeters * 2),
    viewport: viewportDims,
    currentScale: scale,
    currentTranslation: { x: translationX, y: translationY },
    trail: {
      degrees: trailDims?.degrees ?? null,
      meters: trailDims?.meters ?? null,
    },
    spots: {
      total: spots.length,
      inViewport: spotsInViewport,
    },
    surface: {
      layout: surfaceLayout,
    },
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
export function MapCanvasDebug({ animatedStyles }: { animatedStyles: any }) {
  const metrics = useDebugMetrics()
  const { boundary: viewportBoundary, radiusMeters, deviceLocation } = useMapCanvasContext()
  const viewportSize = useMapCanvasDimensions()
  const { scale, translationX, translationY } = useMapCanvasValues()
  const spots = useDiscoverySpotsViewModel()
  const surfaceBoundary = useMapSurfaceBoundary()
  const viewRef = useRef<View>(null)
  const centerX = viewportSize.width / 2
  const centerY = viewportSize.height / 2
  const { layout } = useMapSurface()

  // Spot screen positions
  const spotPositions = useMemo(() =>
    spots.map(spot => {
      const pos = mapUtils.coordinatesToPosition(spot.location, viewportBoundary, viewportSize)
      return {
        ...spot,
        screenPos: pos
      }
    }),
    [spots, viewportBoundary, viewportSize, scale, translationX, translationY]
  )
  // Trail boundary box
  const trailBoundaryBox = useMemo(() => {
    if (!surfaceBoundary) return null
    const topLeft = mapUtils.coordinatesToPosition(
      { lat: surfaceBoundary.northEast.lat, lon: surfaceBoundary.northEast.lon },
      viewportBoundary,
      viewportSize
    )
    const bottomRight = mapUtils.coordinatesToPosition(
      { lat: surfaceBoundary.southWest.lat, lon: surfaceBoundary.southWest.lon },
      viewportBoundary,
      viewportSize
    )
    return {
      left: (topLeft.x - centerX) * scale + translationX + centerX,
      top: (topLeft.y - centerY) * scale + translationY + centerY,
      width: (bottomRight.x - topLeft.x) * scale,
      height: (bottomRight.y - topLeft.y) * scale,
    }
  }, [surfaceBoundary, viewportBoundary, viewportSize, scale, translationX, translationY])

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
      <Animated.View style={[{ position: 'absolute', width: viewportSize.width, height: viewportSize.height }, animatedStyles]} pointerEvents="none">

        {/* Trail boundary box */}
        {surfaceBoundary && trailBoundaryBox && (
          <View style={[styles.trailBoundaryBox, {
            top: layout.top,
            left: layout.left,
            width: layout.width,
            height: layout.height,

          }]}>
            <Text style={styles.trailBoundaryLabel}>Trail Boundary</Text>
            {spotPositions.map((spot, i) => (
              <View id={`spot-${spot.id || i}`} key={spot.id || i} style={[styles.spotMarker, { left: spot.screenPos.x, top: spot.screenPos.y, }]}>
                <View style={styles.spotDot} />
              </View>
            ))}
          </View>
        )}
        {/* Spot markers */}

      </Animated.View>
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
          Viewport: {metrics.viewport.meters.width.toFixed(0)}m × {metrics.viewport.meters.height.toFixed(0)}m
        </Text>
      </View>

      {/* Map Info Box (bottom-left) */}
      {surfaceBoundary && metrics.surface.layout && (
        <View style={styles.mapInfoBox} pointerEvents="none">
          <Text style={styles.infoTitle}>MAP/TRAIL</Text>
          <Text style={styles.infoText}>
            Center: {((surfaceBoundary.northEast.lat + surfaceBoundary.southWest.lat) / 2).toFixed(5)},
            {((surfaceBoundary.northEast.lon + surfaceBoundary.southWest.lon) / 2).toFixed(5)}
          </Text>
          <Text style={styles.infoText}>
            Boundary: {metrics.trail.meters?.width.toFixed(0)}m × {metrics.trail.meters?.height.toFixed(0)}m
          </Text>
          <Text style={styles.infoText}>
            Surface: {metrics.surface.layout.width.toFixed(0)}×{metrics.surface.layout.height.toFixed(0)}px
          </Text>
          <Text style={styles.infoText}>
            Spots: {metrics.spots.total} (in view: {metrics.spots.inViewport})
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
    zIndex: 99999
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

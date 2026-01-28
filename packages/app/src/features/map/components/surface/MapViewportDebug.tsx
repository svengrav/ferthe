import { useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useViewportContext, useViewportDimensions, useViewportValues } from '../../stores/viewportStore'

interface DebugMetrics {
  metersPerPixel: number
  pixelRatio: number
  boundaryWidth: number
  boundaryHeight: number
  currentScale: number
  currentTranslation: { x: number; y: number }
}

/**
 * Hook to calculate debug metrics from viewport data
 */
const useMapViewportDebug = (): DebugMetrics => {
  const { boundary, radiusMeters, deviceLocation } = useViewportContext()
  const viewportSize = useViewportDimensions()
  const { scale, translationX, translationY } = useViewportValues()

  // Calculate boundary dimensions in degrees
  const boundaryWidth = boundary.northEast.lon - boundary.southWest.lon
  const boundaryHeight = boundary.northEast.lat - boundary.southWest.lat

  // Calculate meters per pixel (approximate)
  const metersPerPixel = (radiusMeters * 2) / viewportSize.width

  // Console logging (debounced) - use primitive values from store
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)

    logTimeoutRef.current = setTimeout(() => {
      console.group('🔍 Viewport Debug Info')
      console.log('Viewport Size:', viewportSize)
      console.log('Radius (m):', radiusMeters)
      console.log('Meters/Pixel:', metersPerPixel.toFixed(2))
      console.log('Scale:', scale.toFixed(2))
      console.log('Translation:', {
        x: translationX.toFixed(1),
        y: translationY.toFixed(1),
      })
      console.log('GeoBoundary:', {
        NE: `${boundary.northEast.lat.toFixed(5)}, ${boundary.northEast.lon.toFixed(5)}`,
        SW: `${boundary.southWest.lat.toFixed(5)}, ${boundary.southWest.lon.toFixed(5)}`,
        Width: `${boundaryWidth.toFixed(6)}°`,
        Height: `${boundaryHeight.toFixed(6)}°`,
      })
      console.log('Device:', `${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lon.toFixed(5)}`)
      console.groupEnd()
    }, 500)

    return () => {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)
    }
  }, [
    viewportSize.width,
    viewportSize.height,
    radiusMeters,
    metersPerPixel,
    scale,
    translationX,
    translationY,
    deviceLocation.lat,
    deviceLocation.lon,
    boundary.northEast.lat,
    boundary.northEast.lon,
    boundary.southWest.lat,
    boundary.southWest.lon,
  ])

  return {
    metersPerPixel,
    pixelRatio: viewportSize.width / (radiusMeters * 2),
    boundaryWidth,
    boundaryHeight,
    currentScale: scale,
    currentTranslation: {
      x: translationX,
      y: translationY,
    },
  }
}

/**
 * ViewportDebugOverlay Component
 * 
 * Displays debug information overlay on viewport
 * - Visual grid
 * - Border markers
 * - Real-time metrics
 * - Console logging
 */
export function MapViewportDebug() {
  const metrics = useMapViewportDebug()
  const { boundary, radiusMeters, deviceLocation } = useViewportContext()
  const viewportSize = useViewportDimensions()
  const { scale, translationX, translationY } = useViewportValues()

  // Static border showing the viewport boundary (1000x1000px)
  const staticBorderStyle = {
    width: viewportSize.width,
    height: viewportSize.height,
  }

  // Border showing the transformed area (using primitive values)
  const transformedBorderStyle = {
    width: viewportSize.width * scale,
    height: viewportSize.height * scale,
    transform: [
      { translateX: translationX },
      { translateY: translationY }
    ]
  }

  // Center marker always stays at center (device position)
  const centerMarkerStyle = {
    // No transform - stays centered
  }

  // Calculate scaled dimensions from primitive values
  const scaledWidth = viewportSize.width * scale
  const scaledHeight = viewportSize.height * scale

  return (
    <View style={styles.debugContainer} pointerEvents="none" id="map-viewport-debug-overlay">
      {/* Static border showing viewport boundary */}
      <View
        style={[styles.border, staticBorderStyle]}
      />

      {/* Border showing transformed white area */}
      <View
        style={[styles.animatedBorder, transformedBorderStyle]}
      />

      {/* Center crosshair - static at center (device position) */}
      <View
        style={[styles.centerMarker, centerMarkerStyle]}
      >
        <View style={styles.horizontalLine} />
        <View style={styles.verticalLine} />
      </View>

      {/* Grid - static at viewport size */}
      <View
        style={[styles.gridContainer, staticBorderStyle]}
      >
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

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>DEBUG</Text>
        <Text style={styles.infoText}>Center: {deviceLocation.lat.toFixed(5)}, {deviceLocation.lon.toFixed(5)}</Text>
        <Text style={styles.infoText}>Size: {viewportSize.width}×{viewportSize.height}px</Text>
        <Text style={styles.infoText}>
          Scaled: {scaledWidth.toFixed(0)}×{scaledHeight.toFixed(0)}px
        </Text>
        <Text style={styles.infoText}>Radius: {radiusMeters}m</Text>
        <Text style={styles.infoText}>m/px: {metrics.metersPerPixel.toFixed(2)}</Text>
        <Text style={styles.infoText}>Scale: {metrics.currentScale.toFixed(2)}x</Text>
        <Text style={styles.infoText}>
          Offset: {metrics.currentTranslation.x.toFixed(0)}, {metrics.currentTranslation.y.toFixed(0)}
        </Text>
        <Text style={styles.infoText}>
          Bounds: {metrics.boundaryWidth.toFixed(6)}° × {metrics.boundaryHeight.toFixed(6)}°
        </Text>
      </View>

      {/* Corner markers - static at viewport corners */}
      <View
        style={[styles.cornerMarker, styles.topLeft]}
      />
      <View
        style={[styles.cornerMarker, styles.topRight]}
      />
      <View
        style={[styles.cornerMarker, styles.bottomLeft]}
      />
      <View
        style={[styles.cornerMarker, styles.bottomRight]}
      />
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
    borderWidth: 2,
    borderColor: 'rgba(30, 50, 238, 0.8)',
    alignItems: 'center',
    zIndex: 9999,
  },
  border: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(45, 55, 151, 0.8)',
    borderStyle: 'dashed',
  },
  animatedBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(255, 100, 0, 0.9)',
    borderStyle: 'solid',
  },
  gridContainer: {
    position: 'absolute',
  },
  gridLine: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.2)',
  },
  centerMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalLine: {
    position: 'absolute',
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 0, 0.8)',
  },
  verticalLine: {
    position: 'absolute',
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255, 255, 0, 0.8)',
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(255, 0, 0, 0.8)',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  infoBox: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 0, 0.6)',
    minWidth: 200,
  },
  infoTitle: {
    color: '#ffff00',
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

import { getAppContext } from '@app/appContext'
import { ENV } from '@app/env'
import { Theme, useThemeStore } from '@app/shared/theme'
import { View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useMapGestures } from '../hooks/useMapGestures'
import { useMapBoundary, useMapCanvas, useMapLayer, useMapSpots, useMapTrailId, useMapViewport, useSetTappedSpot } from '../stores/mapStore'
import { MapTheme, useMapTheme } from '../stores/mapThemeStore'
import { mapUtils } from '../utils/geoToScreenTransform.'
import MapDeviceCords from './MapDeviceCords'
import MapLayerSwitch from './MapLayerSwitch'
import MapOverlay from './MapOverlay'
import { MapScanner, MapScannerControl } from './MapScanner'
import MapZoomModeIndicator from './MapZoomModeIndicator'
import MapCenterMarker from './surface/MapCenterMarker'
import MapClues from './surface/MapClues'
import MapDebugBoundaries from './surface/MapDebugBoundaries'
import MapDeviceMarker from './surface/MapDeviceMarker'
import MapOffscreenIndicators from './surface/MapOffscreenIndicators'
import MapRadius from './surface/MapRadius'
import MapSnap from './surface/MapSnap'
import MapSpots from './surface/MapSpots'
import MapSurface from './surface/MapSurface'
import MapTrailPath from './surface/MapTrailPath'


export function Map() {
  const { sensorApplication, system } = getAppContext()
  const viewbox = useMapViewport()
  const canvas = useMapCanvas()
  const trailId = useMapTrailId()
  const boundary = useMapBoundary()
  const spots = useMapSpots()
  const mapLayer = useMapLayer()
  const setTappedSpot = useSetTappedSpot()
  const mapTheme = useMapTheme()
  const theme = useThemeStore()
  const styles = createStyles(theme, mapTheme, canvas.size)

  const isOverview = mapLayer === 'OVERVIEW'

  const onTap = (position: { x: number, y: number }) => {
    const geoPosition = mapUtils.positionToCoordinates(position, boundary, canvas.size)

    // Check if tap is on a spot (with some tolerance)
    const TAP_TOLERANCE = 20 // pixels
    const tappedSpot = spots.find(spot => {
      const spotScreenPos = mapUtils.coordinatesToPosition(spot.location, boundary, canvas.size)
      const distance = Math.sqrt(
        Math.pow(position.x - spotScreenPos.x, 2) +
        Math.pow(position.y - spotScreenPos.y, 2)
      )
      return distance <= TAP_TOLERANCE
    })

    if (tappedSpot) {
      setTappedSpot(tappedSpot)
      return
    }

    if (system.isDevelopment)
      sensorApplication.setDevice({
        location: geoPosition,
        heading: 0,
      })
  }

  const { gesture, animatedStyles } = useMapGestures(canvas, viewbox, onTap)

  return (
    <>
      <View style={[styles.contentContainer]} id='map-content' >
        <MapDeviceCords />
        <MapZoomModeIndicator />
        <MapLayerSwitch />

        {/* Overview mode: Show simplified overlay */}
        {isOverview && <MapOverlay />}

        {/* Canvas mode: Show interactive map */}
        {!isOverview && (
          <GestureHandlerRootView id='map-gesture-root' style={{ width: canvas.size.width, height: canvas.size.height }}>
            <GestureDetector gesture={gesture} >
              <Animated.View style={[styles.map, animatedStyles]} id='map-inner'>
                <MapSurface />
                <MapRadius />
                <MapScanner />
                <MapTrailPath />
                <MapClues />
                <MapSnap />
                <MapCenterMarker />
                <MapSpots />
                <MapDeviceMarker />
                {ENV.enableMapDebug && <MapDebugBoundaries />}
              </Animated.View>
            </GestureDetector>
            <MapOffscreenIndicators />
          </GestureHandlerRootView>
        )}

        {!isOverview && <MapScannerControl startScan={() => sensorApplication.startScan(trailId)} />}
      </View>
    </>
  )
}

const createStyles = (theme: Theme, mapTheme: MapTheme, size: { width: number; height: number }) => ({
  coordinates: {
    zIndex: 10,
    padding: 8,
    position: 'absolute' as const,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    top: 0,
    alignItems: 'center' as const,
    color: theme.deriveColor(theme.colors.onSurface, 0.4),
  },
  map: {
    borderRadius: 10,
    width: size.width,
    height: size.height,
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.2),
    position: 'relative' as const,
  },
  centerMarker: {
    position: 'absolute' as const,
    width: 3,
    height: 3,
    borderRadius: 5,
    backgroundColor: theme.deriveColor(theme.colors.onSurface, 0.3),
    top: '50%' as const,
    left: '50%' as const,
    marginLeft: -2,
    marginTop: -2,
  },
  contentContainer: {
    position: 'relative' as const,
    height: '100%' as const,
    backgroundColor: theme.colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    flex: 1,
    overflow: 'hidden' as const,
  },
  mapContainer: {
    overflow: 'hidden' as const,
    height: '100%' as const,
    flex: 1,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
})

import { getAppContext } from '@app/appContext'
import { Theme, useThemeStore } from '@app/shared/theme'
import { View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useMapGestures } from '../hooks/useMapGestures'
import { useMapBoundary, useMapCanvas, useMapTrailId, useMapViewport } from '../stores/mapStore'
import { MapTheme, useMapTheme } from '../stores/mapThemeStore'
import { mapUtils } from '../utils/geoToScreenTransform.'
import MapDeviceCords from './MapDeviceCords'
import { MapScanner, MapScannerControl } from './MapScanner'
import MapCenterMarker from './surface/MapCenterMarker'
import MapClues from './surface/MapClues'
import MapDeviceMarker from './surface/MapDeviceMarker'
import MapRadius from './surface/MapRadius'
import MapSnap from './surface/MapSnap'
import MapSpots from './surface/MapSpots'
import MapSurface from './surface/MapSurface'
import MapTrailPath from './surface/MapTrailPath'


export function Map() {
  const { sensorApplication, isDevelopment } = getAppContext()
  const viewbox = useMapViewport()
  const canvas = useMapCanvas()
  const trailId = useMapTrailId()
  const boundary = useMapBoundary()
  const mapTheme = useMapTheme()
  const theme = useThemeStore()
  const styles = createStyles(theme, mapTheme, canvas.size)

  const onTap = (position: { x: number, y: number }) => {
    const geoPosition = mapUtils.positionToCoordinates(position, boundary, canvas.size)

    if (isDevelopment)
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
        <GestureHandlerRootView id='map-gesture-root' style={{ width: canvas.size.width, height: canvas.size.height }}>
          <GestureDetector gesture={gesture} >
            {/* container = Visible view of the map for the user */}
            <Animated.View style={[styles.map, animatedStyles,]} id='map-inner'>
              <MapSurface />
              <MapRadius />
              <MapScanner />
              <MapTrailPath />
              <MapClues />
              <MapSnap />
              <MapCenterMarker />
              <MapSpots />
              <MapDeviceMarker />
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
        <MapScannerControl startScan={() => sensorApplication.startScan(trailId)} />
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
    ...theme.text.size.sm,
    fontFamily: theme.text.primary.regular,
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

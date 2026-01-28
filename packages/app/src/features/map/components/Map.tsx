import { getAppContext } from '@app/appContext'
import { Theme, useThemeStore } from '@app/shared/theme'
import { View } from 'react-native'
import { useMapBoundary, useMapCanvas, useMapDevice, useMapSpots, useMapStore, useMapTrailId, useMapViewport, useSetTappedSpot } from '../stores/mapStore'
import { MapTheme, useMapTheme } from '../stores/mapThemeStore'
import { mapUtils } from '../utils/geoToScreenTransform.'
import { MapDebug } from './MapDebug.tsx'
import MapDeviceCords from './MapDeviceCords'
import { MapScanner, MapScannerControl } from './MapScanner'
import MapCenterMarker from './surface/MapCenterMarker.tsx'
import MapClues from './surface/MapClues.tsx'
import MapDeviceMarker from './surface/MapDeviceMarker'
import MapRadius from './surface/MapRadius.tsx'
import MapSnap from './surface/MapSnap.tsx'
import MapSpots from './surface/MapSpots.tsx'
import MapSurface from './surface/MapSurface.tsx'
import MapTrailPath from './surface/MapTrailPath.tsx'
import { MapViewport } from './surface/MapViewport.tsx'


export function Map() {
  const { sensorApplication, system } = getAppContext()
  const viewbox = useMapViewport()
  const canvas = useMapCanvas()
  const trailId = useMapTrailId()
  const trailBoundary = useMapBoundary()
  const spots = useMapSpots()
  const setTappedSpot = useSetTappedSpot()
  const mapTheme = useMapTheme()
  const theme = useThemeStore()
  const device = useMapDevice()
  const setViewportTransform = useMapStore(state => state.setViewportTransform)
  const styles = createStyles(theme, mapTheme, canvas.size)

  // Calculate device-centered viewport boundary (1000m radius)
  const deviceViewportBoundary = mapUtils.calculateDeviceViewportBoundary(device.location)

  const onTap = (position: { x: number, y: number }) => {
    const geoPosition = mapUtils.positionToCoordinates(position, deviceViewportBoundary, canvas.size)

    // Check if tap is on a spot (with some tolerance)
    const TAP_TOLERANCE = 20 // pixels
    const tappedSpot = spots.find(spot => {
      const spotScreenPos = mapUtils.coordinatesToPosition(spot.location, deviceViewportBoundary, canvas.size)
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


  return (
    <>
      <View style={[styles.contentContainer]} id='map-content' >
        <MapDeviceCords />

        <MapViewport
          deviceLocation={device.location}
        >
          <MapSurface boundary={trailBoundary || deviceViewportBoundary} deviceViewportBoundary={deviceViewportBoundary}>
            <MapRadius boundary={trailBoundary || deviceViewportBoundary} />
            <MapTrailPath boundary={trailBoundary || deviceViewportBoundary} />
            <MapClues boundary={trailBoundary || deviceViewportBoundary} />
            <MapSnap boundary={trailBoundary || deviceViewportBoundary} />
            <MapCenterMarker />
            <MapSpots boundary={trailBoundary || deviceViewportBoundary} />
          </MapSurface>
          <MapScanner boundary={trailBoundary || deviceViewportBoundary} />

          <MapDeviceMarker />
        </MapViewport>

        {system.isDevelopment && (
          <MapDebug
            spots={spots}
            trailBoundary={trailBoundary}
          />
        )}
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

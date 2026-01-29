import { getAppContext } from '@app/appContext'
import { Theme, useThemeStore } from '@app/shared/theme'
import { View } from 'react-native'
import { useMapDevice, useMapSurface, useMapSurfaceBoundary, useMapTrailId } from '../stores/mapStore'
import { MapTheme, useMapTheme } from '../stores/mapThemeStore'
import { mapUtils } from '../utils/geoToScreenTransform.'
import MapDeviceCords from './MapDeviceCords'
import { MapScanner, MapScannerControl } from './MapScanner'
import MapCenterMarker from './surface/MapCenterMarker.tsx'
import MapClues from './surface/MapClues.tsx'
import MapDeviceMarker from './surface/MapDeviceMarker'
import MapSnap from './surface/MapSnap.tsx'
import MapSpots from './surface/MapSpots.tsx'
import MapSurface from './surface/MapSurface.tsx'
import MapTrailPath from './surface/MapTrailPath.tsx'
import { MapViewport } from './surface/MapViewport.tsx'


export function Map() {
  const { sensorApplication, system } = getAppContext()
  const surface = useMapSurface()
  const trailId = useMapTrailId()
  const trailBoundary = useMapSurfaceBoundary()
  const mapTheme = useMapTheme()
  const theme = useThemeStore()
  const device = useMapDevice()
  const styles = createStyles(theme, mapTheme, surface.layout)

  // Calculate device-centered viewport boundary (1000m radius)
  const deviceViewportBoundary = mapUtils.calculateDeviceViewportBoundary(device.location)

  return (
    <>
      <View style={[styles.contentContainer]} id='map-content' >
        <MapDeviceCords />

        <MapViewport
          deviceLocation={device.location}
        >
          <MapSurface boundary={trailBoundary} deviceViewportBoundary={deviceViewportBoundary} >
            <MapTrailPath />
            <MapClues />
            <MapSnap boundary={trailBoundary} />
            <MapCenterMarker />
            <MapSpots />
          </MapSurface>
          <MapScanner boundary={deviceViewportBoundary} />
          <MapDeviceMarker />
          {/* {system.isDevelopment && (
            <MapDebug spots={spots} trailBoundary={trailBoundary} />
          )} */}
        </MapViewport>
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

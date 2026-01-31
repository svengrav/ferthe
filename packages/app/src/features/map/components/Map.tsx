import { getAppContext } from '@app/appContext'
import { useDiscoveryTrailId } from '@app/features/discovery/stores/discoveryTrailStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { View } from 'react-native'
import { useCompensatedScale, useMapSurface, useMapSurfaceBoundary, useMapSurfaceLayout, useMapViewport, useViewportDimensions } from '../stores/mapStore'
import { MapTheme, useMapTheme } from '../stores/mapThemeStore'
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
  const { sensorApplication } = getAppContext()
  const surface = useMapSurface()
  const boundary = useMapSurfaceBoundary()
  const { size, boundary: viewportBoundary } = useMapViewport()
  const surfaceLayout = useMapSurfaceLayout()
  const viewportSize = useViewportDimensions()
  const scale = useCompensatedScale()
  const trailId = useDiscoveryTrailId()
  const mapTheme = useMapTheme()
  const theme = useThemeStore()
  const styles = createStyles(theme, mapTheme, surface.layout)

  return (
    <>
      <View style={[styles.contentContainer]} id='map-content' >
        <MapDeviceCords />
        <MapViewport>
          <MapTrailPath boundary={viewportBoundary} size={size} scale={scale} />
          <MapClues boundary={viewportBoundary} size={size} scale={scale} />
          <MapSnap boundary={viewportBoundary} size={size} scale={scale} />
          <MapCenterMarker />
          <MapSpots boundary={viewportBoundary} size={size} scale={scale} />
          <MapSurface />
          <MapScanner />
          <MapDeviceMarker mode="canvas" canvasSize={viewportSize} scale={scale} />
        </MapViewport>
        <MapScannerControl startScan={() => trailId && sensorApplication.startScan(trailId)} />
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

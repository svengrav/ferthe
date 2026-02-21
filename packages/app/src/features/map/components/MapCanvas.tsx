import { useDiscoveryTrailId } from '@app/features/discovery/stores/discoveryTrailStore'
import { getAppContextStore } from '@app/shared/stores/appContextStore.ts'
import { Theme, useThemeStore } from '@app/shared/theme'
import { View } from 'react-native'
import { useMapCanvas, useMapSurface } from '../stores/mapStore.ts'
import { MapTheme, useMapTheme } from '../stores/mapThemeStore.ts'
import { MapCanvasViewport } from '../surface/components/MapCanvasViewport.tsx'
import MapCenterMarker from '../surface/components/MapCenterMarker.tsx'
import MapClues from '../surface/components/MapClues.tsx'
import MapDeviceMarker from '../surface/components/MapDeviceMarker.tsx'
import MapSnap from '../surface/components/MapSnap.tsx'
import MapSpots from '../surface/components/MapSpots.tsx'
import MapSurface from '../surface/components/MapSurface.tsx'
import MapTrailPath from '../surface/components/MapTrailPath.tsx'
import MapDeviceCords from './MapDeviceCords.tsx'
import { MapScanner, MapScannerControl } from './MapScanner.tsx'


export function MapCanvas() {
  const { sensorApplication } = getAppContextStore()
  const surface = useMapSurface()
  const { size, boundary } = useMapCanvas()
  const trailId = useDiscoveryTrailId()
  const mapTheme = useMapTheme()
  const theme = useThemeStore()
  const styles = createStyles(theme, mapTheme, surface.layout)

  return (
    <>
      <View style={[styles.contentContainer]} id='map-content' >
        <MapDeviceCords />
        <MapCanvasViewport>
          <MapSurface />
          <MapTrailPath boundary={boundary} size={size} />
          <MapClues boundary={boundary} size={size} />
          <MapSnap boundary={boundary} size={size} />
          <MapCenterMarker />
          <MapSpots boundary={boundary} size={size} />
          <MapScanner />
          <MapDeviceMarker mode="canvas" canvasSize={size} />
        </MapCanvasViewport>
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
    backgroundColor: theme.deriveColor(theme.colors.background, 0.4),
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

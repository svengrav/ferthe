import { getMapService } from './utils/mapService'

import { DiscoveryApplication, getDiscoveryTrailData } from '@app/features/discovery'
import { discoveryService } from '@app/features/discovery/logic/discoveryService'
import { getSensorActions, getSensorData, SensorApplication } from '@app/features/sensor'
import { logger } from '@app/shared/utils/logger'
import { discoveryTrailStore } from '../discovery/stores/discoveryTrailStore'
import { getMapState, getMapStoreActions } from './stores/mapStore'
import { MAP_DEFAULT } from './types/map'
import { mapUtils } from './utils/geoToScreenTransform'
import { calculateScaleForRadius } from './utils/viewportUtils'

export interface MapApplication {
  requestMapState: (viewbox?: { width: number; height: number }) => Promise<void>
}

interface MapApplicationOptions {
  sensor?: SensorApplication
  discoveryApplication?: DiscoveryApplication
}

export function createMapApplication(options: MapApplicationOptions = {}): MapApplication {
  const { discoveryApplication, sensor } = options
  const { setDevice, setSnap, setState, setSurface, setViewport } = getMapStoreActions()
  const { getCompass, calculateMapSnap, calculateOptimalScale } = getMapService()

  let lastTrailId: string | undefined

  sensor?.onDeviceUpdate(device => {
    const { trail, snap, spots, lastDiscovery } = getDiscoveryTrailData()
    const currentState = getMapState()
    if (!trail) return

    const lastDiscoverySpotLocation = discoveryService.getLastDiscoverySpotLocation(lastDiscovery, spots)
    const snapState = calculateMapSnap(spots, device.location, snap?.intensity, lastDiscoverySpotLocation)

    // Update viewport boundary based on device location with current adaptive radius
    const newViewportBoundary = mapUtils.calculateDeviceViewportBoundary(device.location, currentState.viewport.radius)
    const surfaceLayout = mapUtils.calculateSurfaceLayout(
      currentState.surface.boundary,
      newViewportBoundary,
      currentState.viewport.size
    )

    setSnap(snapState)
    setSurface({ boundary: trail?.boundary, layout: surfaceLayout })
    setViewport({ boundary: newViewportBoundary })
    setDevice({
      location: device.location,
      heading: device.heading,
      direction: getCompass(device.heading).direction,
    })
  })

  discoveryApplication?.onDiscoveryTrailUpdate(state => {
    // Only reinitialize map when trail actually changes (not for clue updates)
    if (state.trail.id === lastTrailId) return;
    newMapState()
  })

  discoveryTrailStore.subscribe(st => {
    logger.log('Discovery Store Updated')
  })

  const newMapState = async () => {
    const { trail, spots, snap, lastDiscovery } = getDiscoveryTrailData()
    const currentViewport = getMapState().viewport
    const { device } = getSensorData()
    const { requestDeviceState } = getSensorActions()

    if (!trail) {
      logger.log('No trail loaded, requesting discovery state')
      await discoveryApplication?.requestDiscoveryState()
      return
    }

    // Wait for valid device location (not default 0,0)
    if (!device?.location || (device.location.lat === 0 && device.location.lon === 0)) {
      logger.log('Device location not available yet, cannot update map state')
      requestDeviceState()
      return
    }

    const lastDiscoverySpotLocation = discoveryService.getLastDiscoverySpotLocation(lastDiscovery, spots)
    const snapState = calculateMapSnap(spots, device.location, snap?.intensity, lastDiscoverySpotLocation)
    const optimalScale = calculateOptimalScale(
      { width: MAP_DEFAULT.viewport.width, height: MAP_DEFAULT.viewport.height },
      currentViewport.size
    )

    // Calculate adaptive viewport radius based on trail size
    const adaptiveRadius = mapUtils.calculateAdaptiveViewportRadius(trail.boundary)

    const initialViewportBoundary = mapUtils.calculateDeviceViewportBoundary(device.location, adaptiveRadius)
    const initialSurfaceLayout = mapUtils.calculateSurfaceLayout(
      trail.boundary,
      initialViewportBoundary,
      currentViewport.size
    )

    // Calculate initial scale to show comfortable viewing distance
    const initialScale = calculateScaleForRadius(adaptiveRadius, MAP_DEFAULT.initialViewRadius)

    setState({
      status: 'ready',
      snap: snapState,

      surface: {
        scale: typeof optimalScale === 'number'
          ? { init: optimalScale, min: MAP_DEFAULT.scale.min, max: MAP_DEFAULT.scale.max }
          : optimalScale,
        boundary: trail.boundary,
        image: trail?.map?.image?.url,
        layout: initialSurfaceLayout,
      },

      viewport: {
        ...currentViewport,
        radius: adaptiveRadius,
        boundary: initialViewportBoundary,
        image: trail?.viewport?.image?.url,
        scale: {
          init: initialScale,
          min: MAP_DEFAULT.scale.min,
          max: MAP_DEFAULT.scale.max,
        },
      },

      overlay: {
        scale: { init: 1, min: 0.5, max: 3 },
        offset: { x: 0, y: 0 },
        image: trail?.overview?.image?.url,
      },

      device: {
        location: device.location,
        heading: device.heading ?? 0,
        direction: getCompass(device.heading ?? 0).direction,
      },

      scanner: {
        radius: trail?.options?.scannerRadius || MAP_DEFAULT.radius,
      },
    })
  }

  return {
    requestMapState: newMapState,
  }
}

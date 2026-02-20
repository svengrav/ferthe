import { getMapService } from './services/mapService'

import { DiscoveryApplication, getDiscoverySpots, getDiscoveryTrailData } from '@app/features/discovery'
import { discoveryService } from '@app/features/discovery/services/discoveryService'
import { getDiscoveriesById } from '@app/features/discovery/stores/discoveryStore'
import { getSensorActions, getSensorData, SensorApplication } from '@app/features/sensor'
import { getTrailsById } from '@app/features/trail/stores/trailStore'
import { logger } from '@app/shared/utils/logger'
import { discoveryTrailStore } from '../discovery/stores/discoveryTrailStore'
import { getMapDefaults } from './config/mapDefaults'
import { mapUtils } from './services/geoToScreenTransform'
import { calculateScaleForRadius } from './services/viewportUtils'
import { getMapState, getMapStoreActions } from './stores/mapStore'

export interface MapApplication {
  requestMapState: (viewbox?: { width: number; height: number }) => Promise<void>
}

interface MapApplicationOptions {
  sensor?: SensorApplication
  discoveryApplication?: DiscoveryApplication
}

export function createMapApplication(options: MapApplicationOptions = {}): MapApplication {
  const { discoveryApplication, sensor } = options
  const { setDevice, setSnap, setState, setSurface, setCanvas } = getMapStoreActions()
  const { getCompass, calculateMapSnap } = getMapService()
  const defaults = getMapDefaults()
  let lastTrailId: string | undefined

  sensor?.onDeviceUpdate(device => {
    const { trailId, snap, lastDiscoveryId } = getDiscoveryTrailData()
    const trail = trailId ? getTrailsById()[trailId] : undefined
    const lastDiscovery = lastDiscoveryId ? Object.values(getDiscoveriesById()).find(d => d.id === lastDiscoveryId) : undefined
    const spots = getDiscoverySpots()
    const currentState = getMapState()
    if (!trail) return

    const lastDiscoverySpotLocation = discoveryService.getLastDiscoverySpotLocation(lastDiscovery, spots)
    const snapState = calculateMapSnap(spots, device.location, snap?.intensity, lastDiscoverySpotLocation)

    // Update canvas boundary based on device location with current adaptive radius
    const newCanvasBoundary = mapUtils.calculateDeviceViewportBoundary(device.location, currentState.canvas.radius)
    const surfaceLayout = mapUtils.calculateSurfaceLayout(
      currentState.surface.boundary,
      newCanvasBoundary,
      currentState.canvas.size
    )

    setSnap(snapState)
    setSurface({ boundary: trail?.boundary, layout: surfaceLayout })
    setCanvas({ boundary: newCanvasBoundary })
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
    const { trailId, snap, lastDiscoveryId } = getDiscoveryTrailData()
    const trail = trailId ? getTrailsById()[trailId] : undefined
    const lastDiscovery = lastDiscoveryId ? Object.values(getDiscoveriesById()).find(d => d.id === lastDiscoveryId) : undefined
    const spots = getDiscoverySpots()
    const currentCanvas = getMapState().canvas
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

    // Calculate adaptive canvas radius based on trail size
    const adaptiveRadius = mapUtils.calculateAdaptiveViewportRadius(trail.boundary)

    const initialCanvasBoundary = mapUtils.calculateDeviceViewportBoundary(device.location, adaptiveRadius)
    const initialSurfaceLayout = mapUtils.calculateSurfaceLayout(
      trail.boundary,
      initialCanvasBoundary,
      currentCanvas.size
    )

    // Calculate initial scale to show comfortable viewing distance
    const initialScale = calculateScaleForRadius(adaptiveRadius, defaults.initialViewRadius)

    // Calculate dynamic zoom limits for canvas based on adaptive radius and max zoom meters
    const canvasZoomLimits = mapUtils.calculateZoomLimits(
      initialCanvasBoundary,
      { width: defaults.canvas.width, height: defaults.canvas.height },
      currentCanvas.size,
      defaults.zoom.maxMeters
    )

    setState({
      status: 'ready',
      snap: snapState,

      surface: {
        boundary: trail.boundary,
        image: trail?.map?.image?.url,
        layout: initialSurfaceLayout,
      },

      canvas: {
        ...currentCanvas,
        radius: adaptiveRadius,
        boundary: initialCanvasBoundary,
        image: trail?.viewport?.image?.url,
        scale: {
          init: initialScale,
          min: canvasZoomLimits.min,
          max: canvasZoomLimits.max,
        },
      },

      overview: {
        scale: { init: 1, min: defaults.overview.scale.min, max: defaults.overview.scale.max },
        offset: { x: 0, y: 0 },
        image: trail?.overview?.image?.url,
      },

      device: {
        location: device.location,
        heading: device.heading ?? 0,
        direction: getCompass(device.heading ?? 0).direction,
      },

      scanner: {
        radius: trail?.options?.scannerRadius || defaults.radius,
      },
    })
  }

  return {
    requestMapState: newMapState,
  }
}

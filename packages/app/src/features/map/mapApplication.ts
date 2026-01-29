import { getMapService } from './utils/mapService'

import { DiscoveryApplication, getDiscoveryTrailData } from '@app/features/discovery'
import { discoveryService } from '@app/features/discovery/logic/discoveryService'
import { getSensorData, SensorApplication } from '@app/features/sensor'
import { logger } from '@app/shared/utils/logger'
import { discoveryTrailStore } from '../discovery/stores/discoveryTrailStore'
import { getMapState, getMapStoreActions } from './stores/mapStore'
import { MAP_DEFAULT } from './types/map'
import { mapUtils } from './utils/geoToScreenTransform.'

export interface MapApplication {
  requestMapState: (viewbox?: { width: number; height: number }) => Promise<void>
}

interface MapApplicationOptions {
  sensor?: SensorApplication
  discoveryApplication?: DiscoveryApplication
}

export function createMapApplication(options: MapApplicationOptions = {}): MapApplication {
  const { discoveryApplication, sensor } = options
  const { setDevice, setSnap, setState, setSurfaceBoundary, setViewportBoundary, setSurfaceLayout } = getMapStoreActions()
  const { getCompass, calculateDeviceBoundaryStatus, calculateMapSnap, calculateOptimalScale } = getMapService()

  sensor?.onDeviceUpdate(device => {
    const { trail, snap, spots, lastDiscovery } = getDiscoveryTrailData()
    const currentState = getMapState()
    if (!trail) return

    const lastDiscoverySpotLocation = discoveryService.getLastDiscoverySpotLocation(lastDiscovery, spots)
    const snapState = calculateMapSnap(spots, device.location, snap?.intensity, lastDiscoverySpotLocation)

    // Update viewport boundary based on device location
    const newViewportBoundary = mapUtils.calculateDeviceViewportBoundary(device.location, currentState.viewport.radius)

    // Calculate surface layout within viewport
    const topLeft = mapUtils.coordinatesToPosition(
      { lat: currentState.surface.boundary.northEast.lat, lon: currentState.surface.boundary.southWest.lon },
      newViewportBoundary,
      currentState.viewport.size
    )
    const bottomRight = mapUtils.coordinatesToPosition(
      { lat: currentState.surface.boundary.southWest.lat, lon: currentState.surface.boundary.northEast.lon },
      newViewportBoundary,
      currentState.viewport.size
    )
    const surfaceLayout = {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }

    setSnap(snapState)
    setSurfaceBoundary(trail?.boundary)
    setViewportBoundary(newViewportBoundary)
    setSurfaceLayout(surfaceLayout)
    setDevice({
      location: device.location,
      heading: device.heading,
      direction: getCompass(device.heading).direction,
    })
  })

  discoveryApplication?.onDiscoveryTrailUpdate(trail => {
    newMapState()
  })

  discoveryTrailStore.subscribe(st => {
    logger.log('Discovery Store Updated')
  })

  discoveryApplication?.onNewDiscoveries(d => { })

  const newMapState = async () => {
    const { trail, scannedClues, previewClues, spots, snap, discoveries, lastDiscovery } = getDiscoveryTrailData()
    const currentViewport = getMapState().viewport
    const { device } = getSensorData()

    if (!trail) {
      // Trail not loaded yet - silently return and wait for discovery state
      return
    }

    const lastDiscoverySpotLocation = discoveryService.getLastDiscoverySpotLocation(lastDiscovery, spots)
    const snapState = calculateMapSnap(spots, device.location, snap?.intensity, lastDiscoverySpotLocation)
    const optimalScale = calculateOptimalScale(
      { width: MAP_DEFAULT.mapSize.width, height: MAP_DEFAULT.mapSize.height },
      currentViewport.size
    )

    const initialViewportBoundary = mapUtils.calculateDeviceViewportBoundary(
      device?.location || { lat: 0, lon: 0 },
      currentViewport.radius
    )

    // Calculate initial surface layout
    const topLeft = mapUtils.coordinatesToPosition(
      { lat: trail.boundary.northEast.lat, lon: trail.boundary.southWest.lon },
      initialViewportBoundary,
      currentViewport.size
    )
    const bottomRight = mapUtils.coordinatesToPosition(
      { lat: trail.boundary.southWest.lat, lon: trail.boundary.northEast.lon },
      initialViewportBoundary,
      currentViewport.size
    )
    const initialSurfaceLayout = {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }

    setState({
      status: 'ready',
      trailId: trail?.id || '',
      scannedClues: scannedClues || [],
      previewClues: previewClues || [],
      spots: spots,
      snap: snapState,
      deviceStatus: calculateDeviceBoundaryStatus(device?.location, trail.boundary),

      surface: {
        scale: typeof optimalScale === 'number'
          ? { init: optimalScale, min: MAP_DEFAULT.scale.min, max: MAP_DEFAULT.scale.max }
          : optimalScale,
        boundary: trail.boundary,
        image: trail?.map?.image,
        layout: initialSurfaceLayout,
      },

      viewport: {
        ...currentViewport,
        boundary: initialViewportBoundary,
      },

      device: {
        location: device?.location || { lat: 0, lon: 0 },
        heading: device?.heading || 0,
        direction: getCompass(device?.heading || 0).direction,
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

import { DiscoveryApplication, getDiscoveryTrailData } from '@app/features/discovery'
import { discoveryService } from '@app/features/discovery/logic/discoveryService'
import { getSensorData, SensorApplication } from '@app/features/sensor'
import { logger } from '@app/shared/utils/logger'

import { getMapState, getMapStoreActions } from './stores/mapStore'
import { createMapState, MAP_DEFAULT } from './types/map'
import { getMapService } from './utils/mapService'

export interface MapApplication {
  requestMapState: () => Promise<void>
}

interface MapApplicationOptions {
  sensor?: SensorApplication
  discoveryApplication?: DiscoveryApplication
}

const DEFAULT_VIEWPORT_WIDTH = 550
const MAX_BOUNDARY_RADIUS = 5000

export function createMapApplication(options: MapApplicationOptions = {}): MapApplication {
  const { discoveryApplication, sensor } = options

  // Store actions
  const { setDevice, setCompass, setSnap, setState } = getMapStoreActions()

  // Service functions
  const {
    getCompass,
    getTrailBoundary,
    calculateMetersPerPixel,
    evaluateZoomMode,
    calculateDeviceBoundaryStatus,
    calculateMapSnap,
    calculateOptimalScale,
    calculateZoomTransitionScale,
    calculateCanvasSize,
    clampBoundaryToRadius,
  } = getMapService()

  // Device updates → Update compass and snap state
  sensor?.onDeviceUpdate(device => {
    const { trail, snap, spots, lastDiscovery } = getDiscoveryTrailData()
    if (!trail) return

    setDevice({ location: device.location, heading: device.heading })
    setCompass(getCompass(device.heading))

    const lastDiscoverySpotLocation = discoveryService.getLastDiscoverySpotLocation(lastDiscovery, spots)
    setSnap(calculateMapSnap(spots, device.location, snap?.intensity, lastDiscoverySpotLocation))
  })

  // Trail updates → Rebuild map state
  discoveryApplication?.onDiscoveryTrailUpdate(trail => {
    logger.log('onDiscoveryTrailUpdate triggered', { trailId: trail?.id })
    updateMapState()
  })

  /**
   * Builds complete map state from current discovery and sensor data
   */
  const updateMapState = async () => {
    const { trail, scannedClues, previewClues, spots, snap, lastDiscovery } = getDiscoveryTrailData()
    const currentState = getMapState()
    const viewboxSize = currentState.viewport
    const { device } = getSensorData()

    if (!trail) {
      logger.log('updateMapState: No trail yet')
      return
    }

    // Calculate boundaries
    const trailBoundary = getTrailBoundary(trail, spots)
    const boundary = clampBoundaryToRadius(trailBoundary, device?.location, MAX_BOUNDARY_RADIUS)
    const canvasSize = calculateCanvasSize(boundary)

    // Calculate zoom mode
    const viewportWidth = viewboxSize.width || DEFAULT_VIEWPORT_WIDTH
    const metersPerPixel = calculateMetersPerPixel(boundary, viewportWidth)
    const newZoomMode = evaluateZoomMode(metersPerPixel, viewportWidth, currentState.zoomMode)

    // Calculate snap state
    const lastDiscoverySpotLocation = discoveryService.getLastDiscoverySpotLocation(lastDiscovery, spots)
    const snapState = calculateMapSnap(spots, device.location, snap?.intensity, lastDiscoverySpotLocation)

    // Build new state
    const newState = createMapState(() => ({
      status: 'ready',
      zoomMode: newZoomMode,
      boundary,
      trailBoundary,
      compass: getCompass(device?.heading || 0),
      device: {
        location: device?.location || { lat: 0, lon: 0 },
        heading: device?.heading || 0,
      },
      scannedClues: scannedClues || [],
      previewClues: previewClues || [],
      trailId: trail?.id || '',
      spots,
      deviceStatus: calculateDeviceBoundaryStatus(device?.location, boundary),
      canvas: {
        size: canvasSize,
        scale: calculateOptimalScale(canvasSize, viewboxSize),
        image: trail?.map?.image,
      },
      scanner: {
        radius: trail?.options?.scannerRadius || MAP_DEFAULT.radius,
      },
      snap: snapState,
      viewport: viewboxSize,
      scale: MAP_DEFAULT.scale.init,
    }))

    setState(newState)

    // Handle zoom mode transition
    if (newZoomMode !== currentState.zoomMode) {
      const targetScale = calculateZoomTransitionScale(newZoomMode, boundary, viewboxSize, currentState.canvas)
      logger.log(`Zoom mode transition: ${currentState.zoomMode} → ${newZoomMode}`)
      setState({ ...newState, zoomMode: newZoomMode, scale: targetScale })
    }
  }

  return {
    requestMapState: updateMapState,
  }
}

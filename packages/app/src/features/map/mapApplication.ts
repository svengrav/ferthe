import { getMapService } from './utils/mapService'

import { DiscoveryApplication, getDiscoveryTrailData } from '@app/features/discovery'
import { getSensorData, SensorApplication } from '@app/features/sensor'
import { discoveryTrailStore } from '../discovery/stores/discoveryTrailStore'
import { getMapState, getMapStoreActions } from './stores/mapStore'
import { createMapState, MAP_DEFAULT } from './types/map'

export interface MapApplication {
  requestMapState: (viewbox?: { width: number; height: number }) => Promise<void>
}

interface MapApplicationOptions {
  sensor?: SensorApplication
  discoveryApplication?: DiscoveryApplication
}

export function createMapApplication(options: MapApplicationOptions = {}): MapApplication {
  const { discoveryApplication, sensor } = options
  const { setDevice, setCompass, setSnap, setState, setRegion, setBoundary } = getMapStoreActions()
  const { getCompass, calculateMapRegion, calculateDeviceBoundaryStatus, calculateMapSnap, calculateOptimalScale } = getMapService()

  sensor?.onDeviceUpdate(device => {
    const { trail, snap } = getDiscoveryTrailData()

    setDevice({
      location: device.location,
      heading: device.heading,
    })
    setCompass(getCompass(device.heading))
    const { spots } = getMapState()
    const snapState = calculateMapSnap(spots, device.location, snap?.intensity)
    const { boundary, region } = calculateMapRegion(trail?.region, device?.location)

    setBoundary(boundary)
    setRegion({
      ...region,
      innerRadius: 200,
    })

    setSnap(snapState)
  })

  discoveryApplication?.onDiscoveryTrailUpdate(trail => {
    newMapState()
  })

  discoveryTrailStore.subscribe(st => {
    console.log('Discovery Store Updated:', st)
  })

  discoveryApplication?.onNewDiscoveries(d => {})

  const newMapState = async (viewbox?: { width: number; height: number }) => {
    const { trail, scannedClues, previewClues, spots, snap } = getDiscoveryTrailData()
    const viewboxSize = getMapState().viewport
    const { device } = getSensorData()
    if (!trail) {
      console.error('No trail found')
      discoveryApplication?.requestDiscoveryState()
      return
    }
    const { boundary, region } = calculateMapRegion(trail.region, device?.location)
    const snapState = calculateMapSnap(spots, device.location, snap?.intensity)
    setState(
      createMapState(defaults => ({
        status: 'ready',
        boundary: boundary,
        compass: getCompass(device?.heading || 0),
        device: {
          location: device?.location || { lat: 0, lon: 0 },
          heading: device?.heading || 0,
        },
        scannedClues: scannedClues || [],
        previewClues: previewClues || [],
        trailId: trail?.id || '',
        spots: spots || [],
        deviceStatus: calculateDeviceBoundaryStatus(device?.location, boundary),
        region: {
          ...region,
          innerRadius: defaults.region.innerRadius,
        },
        canvas: {
          size: {
            width: MAP_DEFAULT.mapSize.width,
            height: MAP_DEFAULT.mapSize.height,
          },
          scale: calculateOptimalScale(defaults.canvas.size, viewboxSize),
          image: trail?.map?.image,
        },
        scanner: {
          radius: trail?.options?.scannerRadius || MAP_DEFAULT.radius,
        },
        snap: snapState,
        viewport: viewboxSize,
        scale: MAP_DEFAULT.scale.init,
      }))
    )
  }

  return {
    requestMapState: newMapState,
  }
}

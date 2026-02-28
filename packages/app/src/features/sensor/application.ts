import { logger } from '@app/shared/utils/logger'
import type { ApiClient } from '@shared/api'
import { ScanEvent } from '@shared/contracts'
import { createEventSystem, Unsubscribe } from '@shared/events/eventHandler'
import { DeviceConnector, DeviceLocation } from './device/types'
import { getDeviceLocation, getSensorActions, sensorStore } from './stores/sensorStore'

type SensorEvents = {
  onScan: ScanEvent
  onDeviceUpdated: DeviceLocation
}

export interface SensorApplication {
  canScan: () => boolean
  startScan: (trailId: string) => Promise<void>
  onScanEvent: (onScanEventCallback: (scanEvent: ScanEvent) => void) => Unsubscribe
  onDeviceUpdate: (onDeviceUpdateCallback: (device: DeviceLocation) => void) => Unsubscribe
  setDevice: (device: DeviceLocation) => void
}

interface SensorApplicationOptions {
  api?: ApiClient
  deviceConnector?: DeviceConnector
}

export const createSensorApplication = (options?: SensorApplicationOptions) => {
  const events = createEventSystem<SensorEvents>()
  const lastScanDate = new Date(0)
  const MINIMUM_SCAN_INTERVAL = 5000 // 5 seconds in milliseconds
  const { deviceConnector, api } = options || {}
  const { setPermissionGranted, setStatusMessage, setStatus, setDeviceStateRequestHandler } = getSensorActions()

  // Initialize permission and location tracking
  const initializeDevice = async () => {
    try {
      if (!deviceConnector) {
        setStatus('error')
        setStatusMessage('Device connector not available')
        return
      }

      const permissionResult = await deviceConnector.requestLocationPermission()
      setPermissionGranted(permissionResult.granted)

      if (!permissionResult.granted) {
        setStatus('permission-required')
        setStatusMessage('Location permission is required to use this feature')
        return
      }

      await deviceConnector.initializeLocationTracking()
      setStatusMessage('Waiting for GPS signal...')
      setStatus('location-unavailable')
    } catch (error) {
      logger.error('Failed to initialize location tracking:', error)
      setStatus('error')
      setStatusMessage('Failed to start location tracking')
    }
  }

  // Register device state request handler
  setDeviceStateRequestHandler(async () => {
    if (!deviceConnector) return
    const permissionResult = await deviceConnector.requestLocationPermission()
    setPermissionGranted(permissionResult.granted)

    if (permissionResult.granted) {
      await initializeDevice()
    } else {
      setStatus('permission-required')
      setStatusMessage('Location permission is required to use this feature')
    }
  })

  initializeDevice()

  let isFirstValidLocation = true

  deviceConnector?.onDeviceUpdated(device => {
    const setSensorState = sensorStore.setState
    const isValidLocation = device.location.lat !== 0 && device.location.lon !== 0

    setSensorState({
      device: {
        location: device.location,
        heading: device.heading,
      },
    })

    if (isValidLocation && isFirstValidLocation) {
      setStatus('ready')
      setStatusMessage(undefined)
      isFirstValidLocation = false
    }

    events.emit('onDeviceUpdated', { location: device.location, heading: device.heading })
  })

  const setDevice = (device: DeviceLocation) => {
    const setSensorState = sensorStore.setState
    setSensorState({
      device: {
        location: device.location,
        heading: device.heading,
      },
    })
    events.emit('onDeviceUpdated', { location: device.location, heading: device.heading })
  }

  const startScan = async (trailId: string) => {
    const { addScanRecord } = getSensorActions()
    const device = getDeviceLocation()

    if (!api) throw new Error('Sensor API is not initialized')
    if (!canScan()) return

    const scanEvent = await api.sensors.createScan({ userPosition: device.location, trailId })
    if (!scanEvent.data) {
      logger.error('Failed to create scan event:', scanEvent.error)
      return
    }

    addScanRecord(scanEvent.data)
    events.emit('onScan', scanEvent.data)
    lastScanDate.setTime(Date.now())
  }

  const onScanEvent = (onScanEventCallback: (scanEvent: ScanEvent) => void) => {
    return events.on('onScan', onScanEventCallback)
  }

  const onDeviceUpdate = (onDeviceUpdateCallback: (device: DeviceLocation) => void) => {
    return events.on('onDeviceUpdated', onDeviceUpdateCallback)
  }

  const canScan = () => {
    const currentTime = Date.now()
    const timeSinceLastScan = currentTime - lastScanDate.getTime()
    return timeSinceLastScan >= MINIMUM_SCAN_INTERVAL
  }

  return {
    setDevice,
    canScan,
    startScan,
    onScanEvent,
    onDeviceUpdate,
  } as SensorApplication
}

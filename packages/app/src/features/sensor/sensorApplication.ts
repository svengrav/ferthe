import { DeviceConnector, DeviceLocation } from './device/types'
import { getSensorActions, getSensorDevice, sensorStore } from './stores/sensorStore'

import { Result, ScanEvent } from '@shared/contracts'
import { createEventSystem, Unsubscribe } from '@shared/events/eventHandler'

import { logger } from '@app/shared/utils/logger'
import { AccountContext, SensorApplicationContract } from '@shared/contracts'

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
  getAccountContext: () => Promise<Result<AccountContext>>
  deviceConnector?: DeviceConnector
  sensorApplication?: SensorApplicationContract
}

export const createSensorApplication = (options?: SensorApplicationOptions) => {
  const events = createEventSystem<SensorEvents>()
  const lastScanDate = new Date(0)
  const MINIMUM_SCAN_INTERVAL = 5000 // 5 seconds in milliseconds
  const { deviceConnector, sensorApplication: core, getAccountContext: getAccountSession } = options || {}

  deviceConnector?.initializeLocationTracking()
  deviceConnector?.requestLocationPermission()

  deviceConnector?.onDeviceUpdated(device => {
    const setSensorState = sensorStore.setState
    setSensorState({
      device: {
        location: device.location,
        heading: device.heading,
      },
    })
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
    const device = getSensorDevice()

    if (!core) throw new Error('Sensor application core is not initialized')
    if (!getAccountSession) throw new Error('getAccountSession function is not provided')
    if (!canScan()) return

    const accountSession = await getAccountSession()
    if (!accountSession.data) {
      logger.error('Failed to get account session:', accountSession.error)
      return
    }

    const scanEvent = await core?.createScanEvent(accountSession.data, device.location, trailId)
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

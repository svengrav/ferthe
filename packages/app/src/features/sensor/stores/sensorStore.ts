import { DeviceLocation } from '@app/features/sensor/device/types'
import { StoreActions, StoreData } from '@app/shared/stores/types'
import { ScanEvent } from '@shared/contracts'
import { create } from 'zustand'

type SensorStatus = 'uninitialized' | 'permission-required' | 'location-unavailable' | 'ready' | 'error'

interface SensorActions extends Omit<StoreActions, 'setStatus'> {
  setDevice: (device: DeviceLocation) => void
  addScanRecord: (record: ScanEvent) => void
  setPermissionGranted: (granted: boolean) => void
  setStatusMessage: (message: string | undefined) => void
  requestPermission: () => Promise<void>
  setPermissionRequestHandler: (handler: () => Promise<void>) => void
  setStatus: (status: SensorStatus) => void
}

interface SensorData extends Omit<StoreData, 'status'> {
  status: SensorStatus
  device: DeviceLocation
  scanRecords: ScanEvent[]
  latestScanId: string | undefined
  scannerRadius: number
  permissionGranted: boolean
  statusMessage: string | undefined
}

export const sensorStore = create<SensorData & SensorActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Sensor specific data
  device: {
    location: { lat: 0, lon: 0 },
    heading: 0,
  },
  scannerRadius: 1000,
  scanRecords: [],
  latestScanId: undefined,
  permissionGranted: false,
  statusMessage: undefined,

  setStatus: status => set({ status }),
  setDevice: device => set({ device }),
  addScanRecord: record => {
    set(state => ({ scanRecords: [...state.scanRecords, record], latestScanId: record.id }))
  },
  setPermissionGranted: granted => set({ permissionGranted: granted }),
  setStatusMessage: message => set({ statusMessage: message }),
  requestPermission: async () => {
    // Will be overridden by sensorApplication
  },
  setPermissionRequestHandler: handler => {
    set({ requestPermission: handler })
  },
}))

export const useLatestScan = () => sensorStore(state => state.latestScanId)
export const useSensorStatus = () => sensorStore(state => state.status)
export const useSensorPermission = () => sensorStore(state => state.permissionGranted)
export const useSensorStatusMessage = () => sensorStore(state => state.statusMessage)

export const getSensorActions = () => ({
  setDevice: sensorStore.getState().setDevice,
  addScanRecord: sensorStore.getState().addScanRecord,
  setPermissionGranted: sensorStore.getState().setPermissionGranted,
  setStatusMessage: sensorStore.getState().setStatusMessage,
  setStatus: sensorStore.getState().setStatus,
  requestPermission: sensorStore.getState().requestPermission,
  setPermissionRequestHandler: sensorStore.getState().setPermissionRequestHandler,
})

export const getSensorDevice = () => sensorStore.getState().device
export const getSensorData = () => sensorStore.getState()

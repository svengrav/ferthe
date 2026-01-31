import { DeviceLocation } from '@app/features/sensor/device/types'
import { StoreActions, StoreData } from '@app/shared/stores/types'
import { ScanEvent } from '@shared/contracts'
import { create } from 'zustand'

interface SensorActions extends StoreActions {
  setDevice: (device: DeviceLocation) => void
  addScanRecord: (record: ScanEvent) => void
}

interface SensorData extends StoreData {
  device: DeviceLocation
  scanRecords: ScanEvent[]
  latestScanId: string | undefined
  scannerRadius: number
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

  setStatus: status => set({ status }),
  setDevice: device => set({ device }),
  addScanRecord: record => {
    set(state => ({ scanRecords: [...state.scanRecords, record], latestScanId: record.id }))
  },
}))

export const useLatestScan = () => sensorStore(state => state.latestScanId)
export const useSensorStatus = () => sensorStore(state => state.status)

export const getSensorActions = () => ({
  setDevice: sensorStore.getState().setDevice,
  addScanRecord: sensorStore.getState().addScanRecord,
})

export const getSensorDevice = () => sensorStore.getState().device
export const getSensorData = () => sensorStore.getState()

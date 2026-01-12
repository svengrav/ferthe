import { GeoLocation } from '@shared/geo'

export type DeviceLocation = { location: GeoLocation; heading: number }

// Define interface for the device connector
export interface DeviceConnector {
  onDeviceUpdated: (cb: (e: DeviceLocation) => void) => () => void
  offDeviceUpdated: (cb: (e: DeviceLocation) => void) => void
  requestLocationPermission: () => Promise<void>
  initializeLocationTracking: () => Promise<void>
  cleanup: () => void
}

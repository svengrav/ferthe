import { Store } from '@core/store/storeFactory.ts'
import { AccountContext, Result, ScanEvent, SensorApplicationContract, TrailApplicationContract } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { createSensorService, SensorServiceType } from './sensorService.ts'

interface SensorApplicationOptions {
  sensorService: SensorServiceType
  scanStore: Store<ScanEvent>
  trailApplication: TrailApplicationContract
}

export interface SensorApplicationActions extends SensorApplicationContract {}

export function createSensorApplication({ sensorService = createSensorService(), scanStore, trailApplication }: SensorApplicationOptions): SensorApplicationActions {
  const createScanEvent = async (context: AccountContext, location: GeoLocation, trailId?: string): Promise<Result<ScanEvent>> => {
    try {
      const userId = context.accountId
      if (!userId) {
        return { success: false, error: { message: 'Account ID required', code: 'ACCOUNT_ID_REQUIRED' } }
      }

      if (!trailId) {
        return { success: false, error: { message: 'Trail ID required', code: 'TRAIL_ID_REQUIRED' } }
      }

      const trailResult = await trailApplication.getTrail(context, trailId)
      if (!trailResult.success || !trailResult.data) {
        return { success: false, error: { message: 'Trail not found', code: 'TRAIL_NOT_FOUND' } }
      }

      const spotsResult = await trailApplication.listSpots(context, trailId)
      if (!spotsResult.success) {
        return { success: false, error: { message: 'Failed to get spots', code: 'SPOTS_ERROR' } }
      }

      const trail = trailResult.data
      const scannerRadius = trail.options?.scannerRadius || 50 // Default 50m if not specified

      const scanEvent = sensorService.generateScanEvent(userId, location, spotsResult.data || [], scannerRadius, trailId)

      const createResult = await scanStore.create(scanEvent)
      if (!createResult.success) {
        return { success: false, error: { message: 'Failed to create scan event', code: 'CREATE_SCAN_EVENT_ERROR' } }
      }

      return { success: true, data: createResult.data! }
    } catch (error: any) {
      return { success: false, error: { message: error.message, code: 'CREATE_SCAN_EVENT_ERROR' } }
    }
  }

  const listScanEvents = async (context: AccountContext, trailId: string): Promise<Result<ScanEvent[]>> => {
    try {
      const userId = context.accountId
      if (!userId) {
        return { success: false, error: { message: 'Account ID required', code: 'ACCOUNT_ID_REQUIRED' } }
      }

      const scanEventsResult = await scanStore.list()
      if (!scanEventsResult.success) {
        return { success: false, error: { message: 'Failed to list scan events', code: 'LIST_SCAN_EVENTS_ERROR' } }
      }

      const scanEvents = scanEventsResult.data || []
      const filteredEvents = scanEvents.filter(scanEvent => scanEvent.accountId === userId).filter(scanEvent => !trailId || scanEvent.trailId === trailId)

      return { success: true, data: filteredEvents }
    } catch (error: any) {
      return { success: false, error: { message: error.message, code: 'LIST_SCAN_EVENTS_ERROR' } }
    }
  }

  return {
    listScanEvents,
    createScanEvent,
  }
}

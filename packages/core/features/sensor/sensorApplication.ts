import { Store } from '@core/store/storeFactory.ts'
import { AccountContext, createErrorResult, createSuccessResult, Discovery, Result, ScanEvent, SensorApplicationContract, SpotApplicationContract, TrailApplicationContract } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { createSensorService, SensorServiceType } from './sensorService.ts'

interface SensorApplicationOptions {
  sensorService: SensorServiceType
  scanStore: Store<ScanEvent>
  trailApplication: TrailApplicationContract
  spotApplication: SpotApplicationContract
  discoveryStore: Store<Discovery>
}

export interface SensorApplicationActions extends SensorApplicationContract { }

export function createSensorApplication({ sensorService = createSensorService(), scanStore, trailApplication, spotApplication, discoveryStore }: SensorApplicationOptions): SensorApplicationActions {
  const createScanEvent = async (context: AccountContext, location: GeoLocation, trailId?: string): Promise<Result<ScanEvent>> => {
    try {
      const userId = context.accountId
      if (!userId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      if (!trailId) {
        return createErrorResult('TRAIL_ID_REQUIRED')
      }

      const trailResult = await trailApplication.getTrail(context, trailId)
      if (!trailResult.success || !trailResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      // Get trail spot IDs and fetch spots
      const trailSpotIdsResult = await trailApplication.getTrailSpotIds(context, trailId)
      if (!trailSpotIdsResult.success || !trailSpotIdsResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const spotsResult = await spotApplication.getSpotsByIds(context, trailSpotIdsResult.data)
      if (!spotsResult.success) {
        return createErrorResult('GET_SPOTS_ERROR')
      }

      const discoveriesResult = await discoveryStore.list()
      const discoveries = discoveriesResult.data || []

      const trail = trailResult.data
      const scannerRadius = trail.options?.scannerRadius || 50 // Default 50m if not specified

      const scanEvent = sensorService.generateScanEvent(userId, location, spotsResult.data || [], scannerRadius, discoveries, trailId)

      const createResult = await scanStore.create(scanEvent)
      if (!createResult.success) {
        return createErrorResult('CREATE_SCAN_EVENT_ERROR')
      }

      return createSuccessResult(createResult.data!)
    } catch (error: any) {
      return createErrorResult('CREATE_SCAN_EVENT_ERROR', { originalError: error.message })
    }
  }

  const listScanEvents = async (context: AccountContext, trailId: string): Promise<Result<ScanEvent[]>> => {
    try {
      const userId = context.accountId
      if (!userId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const scanEventsResult = await scanStore.list()
      if (!scanEventsResult.success) {
        return createErrorResult('LIST_SCAN_EVENTS_ERROR')
      }

      const scanEvents = scanEventsResult.data || []
      const filteredEvents = scanEvents.filter(scanEvent => scanEvent.accountId === userId).filter(scanEvent => !trailId || scanEvent.trailId === trailId)

      return createSuccessResult(filteredEvents)
    } catch (error: any) {
      return createErrorResult('LIST_SCAN_EVENTS_ERROR', { originalError: error.message })
    }
  }

  return {
    listScanEvents,
    createScanEvent,
  }
}

import { SensorApplicationActions } from '@core/features/sensor'
import { Store } from '@core/store/storeFactory'
import {
  AccountContext,
  Clue,
  createErrorResult,
  createSuccessResult,
  Discovery,
  DiscoveryApplicationContract,
  DiscoveryLocationRecord,
  DiscoveryProfile,
  DiscoveryProfileUpdateData,
  DiscoveryTrail,
  LocationWithDirection,
  Result,
  Spot,
  TrailApplicationContract,
} from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { createDiscoveryService, DiscoveryServiceActions } from './discoveryService.ts'

/**
 * Default discovery trail ID used when creating new profiles
 */
const DEFAULT_DISCOVERY_TRAIL_ID = 'clx4j9k2n000101mh8d4k9n2q'

interface DiscoveryApplicationOptions {
  discoveryService: DiscoveryServiceActions
  discoveryStore: Store<Discovery>
  profileStore: Store<DiscoveryProfile>
  sensorApplication: SensorApplicationActions
  trailApplication: TrailApplicationContract
}

export function createDiscoveryApplication(options: DiscoveryApplicationOptions): DiscoveryApplicationContract {
  const { discoveryService = createDiscoveryService(), discoveryStore, profileStore, trailApplication } = options

  const getDiscoveryTrail = async (context: AccountContext, trailId: string, userLocation?: GeoLocation): Promise<Result<DiscoveryTrail>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Orchestration: Fetch required data
      const trailResult = await trailApplication.getTrail(context, trailId)
      if (!trailResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_DISCOVERIES_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      const allSpotsResult = await trailApplication.listSpots(context, trailId)
      const allSpots = allSpotsResult.data || []

      // Pure calculation moved to service, with map boundary filtering
      const discoveryTrail = discoveryService.createDiscoveryTrail(accountId, trailResult.data, discoveries, allSpots, userLocation)

      return createSuccessResult(discoveryTrail)
    } catch (error: any) {
      return createErrorResult('DISCOVERY_TRAIL_ERROR', { originalError: error.message })
    }
  }

  const getDiscoveries = async (context: AccountContext, trailId?: string): Promise<Result<Discovery[]>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_DISCOVERIES_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      const result = discoveryService.getDiscoveries(accountId, discoveries, trailId)
      return createSuccessResult(result)
    } catch (error: any) {
      return createErrorResult('GET_DISCOVERIES_ERROR', { originalError: error.message })
    }
  }

  const getDiscovery = async (context: AccountContext, discoveryId: string): Promise<Result<Discovery | undefined>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_DISCOVERY_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      const discovery = discoveries.find(d => d.id === discoveryId && d.accountId === accountId)
      return createSuccessResult(discovery)
    } catch (error: any) {
      return createErrorResult('GET_DISCOVERY_ERROR', { originalError: error.message })
    }
  }

  const getDiscoveredSpotIds = async (context: AccountContext, trailId?: string): Promise<Result<string[]>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_SPOT_IDS_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      const result = discoveryService.getDiscoveredSpotIds(accountId, discoveries, trailId)
      return createSuccessResult(result)
    } catch (error: any) {
      return createErrorResult('GET_SPOT_IDS_ERROR', { originalError: error.message })
    }
  }

  const getDiscoveredSpots = async (context: AccountContext, trailId?: string): Promise<Result<Spot[]>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_SPOTS_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      const spotsResult = await trailApplication.listSpots(context, trailId)
      const result = discoveryService.getDiscoveredSpots(accountId, discoveries, spotsResult.data || [], trailId)
      return createSuccessResult(result)
    } catch (error: any) {
      return createErrorResult('GET_SPOTS_ERROR', { originalError: error.message })
    }
  }

  const getDiscoveredPreviewClues = async (context: AccountContext, trailId: string): Promise<Result<Clue[]>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const trailResult = await trailApplication.getTrail(context, trailId)
      if (!trailResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const spotsResult = await trailApplication.listSpots(context, trailId)
      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_CLUES_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      const result = discoveryService.getCluesBasedOnPreviewMode(accountId, trailResult.data, discoveries, spotsResult.data || [])
      return createSuccessResult(result)
    } catch (error: any) {
      return createErrorResult('GET_CLUES_ERROR', { originalError: error.message })
    }
  }

  const processLocation = async (context: AccountContext, locationWithDirection: LocationWithDirection, trailId: string): Promise<Result<DiscoveryLocationRecord>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Orchestration: Fetch required data
      const trailResult = await trailApplication.getTrail(context, trailId)
      if (!trailResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const discoveryHistoryResult = await discoveryStore.list()
      if (!discoveryHistoryResult.success) {
        return createErrorResult('PROCESS_LOCATION_ERROR')
      }
      const discoveryHistory = discoveryHistoryResult.data || []

      const spotsResult = await trailApplication.listSpots(context, trailId)
      const allSpots = spotsResult.data || []

      // Orchestration: Process new discoveries
      const result = discoveryService.processLocationUpdate(accountId, locationWithDirection, discoveryHistory, allSpots, trailResult.data)

      // Save discoveries - duplicates are handled by the enhanced store
      await Promise.all(result.discoveries.map(discovery => discoveryStore.create(discovery)))

      return createSuccessResult(result)
    } catch (error: any) {
      return createErrorResult('PROCESS_LOCATION_ERROR', { originalError: error.message })
    }
  }

  const getDiscoveryProfile = async (context: AccountContext): Promise<Result<DiscoveryProfile>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Try to get existing profile
      const existingProfileResult = await profileStore.get(accountId)

      if (existingProfileResult.success && existingProfileResult.data) {
        return createSuccessResult(existingProfileResult.data)
      }

      // Create new profile if it doesn't exist
      const now = new Date()
      const newProfile: DiscoveryProfile = {
        id: accountId,
        accountId,
        lastActiveTrailId: DEFAULT_DISCOVERY_TRAIL_ID,
        createdAt: now,
        updatedAt: now,
      }

      const createdProfileResult = await profileStore.create(newProfile)
      if (createdProfileResult.success && createdProfileResult.data) {
        return createSuccessResult(createdProfileResult.data)
      }

      return createErrorResult('GET_PROFILE_ERROR')
    } catch (error: any) {
      return createErrorResult('GET_PROFILE_ERROR', { originalError: error.message })
    }
  }

  const updateDiscoveryProfile = async (context: AccountContext, updateData: DiscoveryProfileUpdateData): Promise<Result<DiscoveryProfile>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get or create profile first
      const profileResult = await getDiscoveryProfile(context)
      if (!profileResult.data) {
        return createErrorResult('GET_PROFILE_ERROR')
      }

      // Update the profile with new data
      const updatedProfileResult = await profileStore.update(accountId, {
        ...updateData,
        updatedAt: new Date(),
      })

      if (updatedProfileResult.success && updatedProfileResult.data) {
        return createSuccessResult(updatedProfileResult.data)
      }

      return createErrorResult('GET_PROFILE_ERROR')
    } catch (error: any) {
      return createErrorResult('UPDATE_TRAIL_ERROR', { originalError: error.message })
    }
  }

  return {
    getDiscoveryTrail,
    processLocation,
    getDiscoveries,
    getDiscovery,
    getDiscoveredSpotIds,
    getDiscoveredSpots,
    getDiscoveredPreviewClues,
    getDiscoveryProfile,
    updateDiscoveryProfile,
  }
}

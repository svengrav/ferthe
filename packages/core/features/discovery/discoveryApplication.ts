import { SensorApplicationActions } from '@core/features/sensor'
import { SpotApplicationActions } from '@core/features/spot/spotApplication.ts'
import { Store } from '@core/store/storeFactory'
import { createDeterministicId } from '@core/utils/idGenerator.ts'
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
  DiscoverySpot,
  DiscoveryStats,
  DiscoveryTrail,
  LocationWithDirection,
  QueryOptions,
  RatingSummary,
  Result,
  SpotRating,
  TrailApplicationContract,
  TrailStats,
  WelcomeDiscoveryResult
} from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { createDiscoveryService, DiscoveryServiceActions } from './discoveryService.ts'
/**
 * Default discovery trail ID used when creating new profiles
 */
const DEFAULT_DISCOVERY_TRAIL_ID = 'clx4j9k2n000101mh8d4k9n2q'

/**
 * Pre-uploaded welcome spot image blob paths (uploaded once via tools/upload-image.ts).
 * Image type: spot, Owner: system
 */
const WELCOME_SPOT_IMAGE_BLOB_PATH = '06r5e44o2rlelaqybh0b.webp'
const WELCOME_SPOT_BLURRED_IMAGE_BLOB_PATH = '06r5e44o2rlelaqybh0b-blurred.webp'

interface DiscoveryApplicationOptions {
  discoveryService: DiscoveryServiceActions
  discoveryStore: Store<Discovery>
  profileStore: Store<DiscoveryProfile>
  sensorApplication: SensorApplicationActions
  trailApplication: TrailApplicationContract
  spotApplication: SpotApplicationActions
}

export function createDiscoveryApplication(options: DiscoveryApplicationOptions): DiscoveryApplicationContract {
  const { discoveryService = createDiscoveryService(), discoveryStore, profileStore, trailApplication, spotApplication } = options

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

      // Get trail spot IDs and fetch spots
      const spotIdsResult = await trailApplication.getTrailSpotIds(context, trailId)
      if (!spotIdsResult.success || !spotIdsResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const allSpotsResult = await spotApplication.getSpotsByIds(context, spotIdsResult.data)
      const allSpots = allSpotsResult.data || []

      // Pure calculation moved to service, with map boundary filtering
      const discoveryTrail = discoveryService.createDiscoveryTrail(accountId, trailResult.data, discoveries, allSpots, spotIdsResult.data || [], userLocation)

      return createSuccessResult(discoveryTrail)
    } catch (error: any) {
      return createErrorResult('DISCOVERY_TRAIL_ERROR', { originalError: error.message })
    }
  }

  const getDiscoveries = async (context: AccountContext, trailId?: string, options?: QueryOptions): Promise<Result<Discovery[]>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const queryOptions = {
        ...options,
        filters: { ...options?.filters, accountId },
      }

      const discoveriesResult = await discoveryStore.list(queryOptions)
      if (!discoveriesResult.success) {
        return createErrorResult('GET_DISCOVERIES_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      const result = trailId
        ? discoveries.filter(d => d.trailId === trailId)
        : discoveries

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

  const getDiscoveredSpots = async (context: AccountContext, trailId?: string, options?: QueryOptions): Promise<Result<DiscoverySpot[]>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const queryOptions = {
        ...options,
        filters: { ...options?.filters, accountId },
      }

      const discoveriesResult = await discoveryStore.list(queryOptions)
      if (!discoveriesResult.success) {
        return createErrorResult('GET_SPOTS_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      // Fetch spots: use trail spot IDs if trailId provided, otherwise fetch by discovery spot IDs
      let spotsResult
      if (trailId) {
        const trailSpotIdsResult = await trailApplication.getTrailSpotIds(context, trailId)
        if (!trailSpotIdsResult.success || !trailSpotIdsResult.data) {
          return createErrorResult('TRAIL_NOT_FOUND')
        }
        spotsResult = await spotApplication.getSpotsByIds(context, trailSpotIdsResult.data, options)
      } else {
        const discoveredSpotIds = discoveries.map(d => d.spotId)
        spotsResult = await spotApplication.getSpotsByIds(context, discoveredSpotIds, options)
      }

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

      // Get trail spot IDs and fetch spots
      const spotIdsResult = await trailApplication.getTrailSpotIds(context, trailId)
      if (!spotIdsResult.success || !spotIdsResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const spotsResult = await spotApplication.getSpotsByIds(context, spotIdsResult.data)
      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_CLUES_ERROR')
      }
      const discoveries = discoveriesResult.data || []

      const result = discoveryService.getCluesBasedOnPreviewMode(accountId, trailResult.data, discoveries, spotsResult.data || [], spotIdsResult.data)
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

      // Get trail spot IDs and fetch spots
      const trailSpotIdsResult = await trailApplication.getTrailSpotIds(context, trailId)
      if (!trailSpotIdsResult.success || !trailSpotIdsResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const spotsResult = await spotApplication.getSpotsByIds(context, trailSpotIdsResult.data)
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

  const getDiscoveryStats = async (context: AccountContext, discoveryId: string): Promise<Result<DiscoveryStats>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get the specific discovery
      const discoveryResult = await getDiscovery(context, discoveryId)
      if (!discoveryResult.data) {
        return createErrorResult('DISCOVERY_NOT_FOUND')
      }
      const discovery = discoveryResult.data

      // Get all discoveries for this spot (all users) for ranking
      const allDiscoveriesResult = await discoveryStore.list()
      if (!allDiscoveriesResult.success) {
        return createErrorResult('GET_DISCOVERIES_ERROR')
      }
      const allDiscoveries = allDiscoveriesResult.data || []
      const allDiscoveriesForSpot = allDiscoveries.filter(d => d.spotId === discovery.spotId)

      // Get all user's discoveries sorted by date for time/distance calculation
      const userDiscoveries = allDiscoveries
        .filter(d => d.accountId === accountId)
        .sort((a, b) => new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime())

      // Get trail spot IDs in order
      const trailSpotIdsResult = await trailApplication.getTrailSpotIds(context, discovery.trailId)
      if (!trailSpotIdsResult.success || !trailSpotIdsResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      // Get all spots for distance calculation
      const spotsResult = await spotApplication.getSpotsByIds(context, trailSpotIdsResult.data)
      const spots = spotsResult.data || []

      // Filter trail spot IDs to only existing spots (stale junction-table entries may reference deleted spots)
      const existingSpotIdSet = new Set(spots.map(s => s.id))
      const existingTrailSpotIds = trailSpotIdsResult.data.filter(id => existingSpotIdSet.has(id))

      // Calculate stats using service
      const stats = discoveryService.getDiscoveryStats(
        discovery,
        allDiscoveriesForSpot,
        userDiscoveries,
        existingTrailSpotIds,
        spots
      )

      return createSuccessResult(stats)
    } catch (error: any) {
      return createErrorResult('GET_DISCOVERY_STATS_ERROR', { originalError: error.message })
    }
  }

  // Rating methods (delegated to SpotApplication with access control)
  const rateSpot = async (
    context: AccountContext,
    spotId: string,
    rating: number
  ): Promise<Result<SpotRating>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Access control - only users who discovered the spot may rate it (creator cannot rate own spot)
      const spotResult = await spotApplication.getSpot(context, spotId)
      if (!spotResult.success) {
        return createErrorResult('GET_SPOT_ERROR')
      }

      if (spotResult.data?.createdBy === accountId) {
        return createErrorResult('SPOT_RATING_NOT_ALLOWED')
      }

      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_DISCOVERIES_ERROR')
      }

      const hasDiscovered = discoveriesResult.data?.some(
        d => d.accountId === accountId && d.spotId === spotId
      )

      if (!hasDiscovered) {
        return createErrorResult('SPOT_NOT_DISCOVERED')
      }

      // Delegate to SpotApplication
      return await spotApplication.rateSpot(context, spotId, rating)
    } catch (error: any) {
      return createErrorResult('RATE_ERROR', { originalError: error.message })
    }
  }

  const removeSpotRating = async (context: AccountContext, spotId: string): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Delegate to SpotApplication (no access control needed for removal)
      return await spotApplication.removeSpotRating(context, spotId)
    } catch (error: any) {
      return createErrorResult('REMOVE_RATING_ERROR', { originalError: error.message })
    }
  }

  const getSpotRatingSummary = async (context: AccountContext, spotId: string): Promise<Result<RatingSummary>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Public access - ratings can be viewed in preview mode
      return await spotApplication.getSpotRatingSummary(context, spotId)
    } catch (error: any) {
      return createErrorResult('GET_RATING_SUMMARY_ERROR', { originalError: error.message })
    }
  }

  const getDiscoveryTrailStats = async (context: AccountContext, trailId: string): Promise<Result<TrailStats>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get trail spot IDs
      const trailSpotIdsResult = await trailApplication.getTrailSpotIds(context, trailId)
      if (!trailSpotIdsResult.success || !trailSpotIdsResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const trailSpotIds = trailSpotIdsResult.data

      if (trailSpotIds.length === 0) {
        return createErrorResult('TRAIL_HAS_NO_SPOTS')
      }

      // Filter to only spots that actually exist in the spot store
      // (trail-spot-relations may contain stale entries for deleted/non-existent spots)
      const existingSpotsResult = await spotApplication.getSpotsByIds(context, trailSpotIds, { exclude: ['images', 'userStatus'] })
      const existingSpotIds = (existingSpotsResult.data || []).map(s => s.id)

      if (existingSpotIds.length === 0) {
        return createErrorResult('TRAIL_HAS_NO_SPOTS')
      }

      // Get all discoveries
      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_DISCOVERIES_ERROR')
      }

      const allDiscoveries = discoveriesResult.data || []

      // Calculate stats using service (only counting spots that actually exist)
      const stats = discoveryService.getTrailStats(accountId, trailId, allDiscoveries, existingSpotIds)

      return createSuccessResult(stats)
    } catch (error: any) {
      return createErrorResult('GET_TRAIL_STATS_ERROR', { originalError: error.message })
    }
  }

  const createWelcomeDiscovery = async (context: AccountContext, location: GeoLocation): Promise<Result<WelcomeDiscoveryResult>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Deterministic discovery ID ensures idempotency — safe to call multiple times
      const welcomeDiscoveryId = createDeterministicId('welcome-discovery', accountId)

      // Idempotency check: return existing if already created
      const existing = await discoveryStore.list()
      const existingDiscovery = existing.data?.find(d => d.id === welcomeDiscoveryId)
      if (existingDiscovery) {
        const spotResult = await spotApplication.getSpot(context, existingDiscovery.spotId)
        if (spotResult.data) {
          return createSuccessResult({ discovery: existingDiscovery, spot: spotResult.data })
        }
      }

      // Create welcome spot at user's location (id + slug generated by spotApplication)
      const now = new Date()
      const spotResult = await spotApplication.createSpot(context, {
        name: 'Willkommen!',
        description: 'An diesem Ort hast du ferthe zum ersten Mal gestartet. Willkommen!',
        location,
        imageBlobPath: WELCOME_SPOT_IMAGE_BLOB_PATH,
        blurredImageBlobPath: WELCOME_SPOT_BLURRED_IMAGE_BLOB_PATH,
        options: { discoveryRadius: 0, clueRadius: 0 },
        source: 'created',
        createdBy: accountId,
        createdAt: now,
        updatedAt: now,
      })

      if (!spotResult.success || !spotResult.data) {
        return createErrorResult('CREATE_SPOT_ERROR')
      }

      // Persist the discovery record with deterministic ID
      const discovery: Discovery = {
        id: welcomeDiscoveryId,
        accountId,
        spotId: spotResult.data.id,
        trailId: DEFAULT_DISCOVERY_TRAIL_ID,
        discoveredAt: now,
        createdAt: now,
        updatedAt: now,
      }

      const discoveryResult = await discoveryStore.create(discovery)
      if (!discoveryResult.success) {
        return createErrorResult('CREATE_DISCOVERY_ERROR')
      }

      return createSuccessResult({ discovery: discoveryResult.data!, spot: spotResult.data })
    } catch (error: any) {
      return createErrorResult('CREATE_WELCOME_DISCOVERY_ERROR', { originalError: error.message })
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
    getDiscoveryStats,
    getDiscoveryTrailStats,
    rateSpot,
    removeSpotRating,
    getSpotRatingSummary,
    createWelcomeDiscovery,
  }
}

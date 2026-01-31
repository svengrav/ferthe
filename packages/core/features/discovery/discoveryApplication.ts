import { SensorApplicationActions } from '@core/features/sensor'
import { Store } from '@core/store/storeFactory'
import {
  AccountContext,
  Clue,
  createErrorResult,
  createSuccessResult,
  Discovery,
  DiscoveryApplicationContract,
  DiscoveryContent,
  DiscoveryLocationRecord,
  DiscoveryProfile,
  DiscoveryProfileUpdateData,
  DiscoveryReaction,
  DiscoverySpot,
  DiscoveryStats,
  DiscoveryTrail,
  ImageApplicationContract,
  LocationWithDirection,
  ReactionSummary,
  Result,
  TrailApplicationContract
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
  contentStore: Store<DiscoveryContent>
  reactionStore: Store<DiscoveryReaction>
  sensorApplication: SensorApplicationActions
  trailApplication: TrailApplicationContract
  imageApplication?: ImageApplicationContract
}

export function createDiscoveryApplication(options: DiscoveryApplicationOptions): DiscoveryApplicationContract {
  const { discoveryService = createDiscoveryService(), discoveryStore, profileStore, contentStore, reactionStore, trailApplication, imageApplication } = options

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

      // Get trail spot IDs in order
      const trailSpotIdsResult = await trailApplication.getTrailSpotIds(context, trailId)
      if (!trailSpotIdsResult.success) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      // Pure calculation moved to service, with map boundary filtering
      const discoveryTrail = discoveryService.createDiscoveryTrail(accountId, trailResult.data, discoveries, allSpots, trailSpotIdsResult.data || [], userLocation)

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

  const getDiscoveredSpots = async (context: AccountContext, trailId?: string): Promise<Result<DiscoverySpot[]>> => {
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

      // Get trail spot IDs in order
      const trailSpotIdsResult = await trailApplication.getTrailSpotIds(context, trailId)
      if (!trailSpotIdsResult.success || !trailSpotIdsResult.data) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      const result = discoveryService.getCluesBasedOnPreviewMode(accountId, trailResult.data, discoveries, spotsResult.data || [], trailSpotIdsResult.data)
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
      const spotsResult = await trailApplication.listSpots(context)
      const spots = spotsResult.data || []

      // Calculate stats using service
      const stats = discoveryService.getDiscoveryStats(
        discovery,
        allDiscoveriesForSpot,
        userDiscoveries,
        trailSpotIdsResult.data,
        spots
      )

      return createSuccessResult(stats)
    } catch (error: any) {
      return createErrorResult('GET_DISCOVERY_STATS_ERROR', { originalError: error.message })
    }
  }

  // Content methods (image + comment)
  const addDiscoveryContent = async (
    context: AccountContext,
    discoveryId: string,
    content: { imageUrl?: string; comment?: string }
  ): Promise<Result<DiscoveryContent>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Verify discovery exists and belongs to user
      const discoveryResult = await getDiscovery(context, discoveryId)
      if (!discoveryResult.data) {
        return createErrorResult('DISCOVERY_NOT_FOUND')
      }

      // Check if content already exists
      const existingResult = await contentStore.list()
      const existing = existingResult.data?.find(c => c.discoveryId === discoveryId)
      if (existing) {
        return createErrorResult('CONTENT_ALREADY_EXISTS')
      }

      // Handle image upload if base64 data provided
      let finalImageUrl = content.imageUrl
      if (content.imageUrl && content.imageUrl.startsWith('data:image')) {
        if (!imageApplication) {
          return createErrorResult('STORAGE_CONNECTOR_NOT_CONFIGURED')
        }

        const uploadResult = await imageApplication.uploadImage(context, 'discovery', discoveryId, content.imageUrl)
        if (!uploadResult.success || !uploadResult.data) {
          return createErrorResult('IMAGE_UPLOAD_ERROR')
        }
        finalImageUrl = uploadResult.data
      }

      const newContent = discoveryService.createDiscoveryContent(accountId, discoveryId, {
        ...content,
        imageUrl: finalImageUrl,
      })
      const saveResult = await contentStore.create(newContent)
      if (!saveResult.success) {
        return createErrorResult('SAVE_CONTENT_ERROR')
      }

      return createSuccessResult(newContent)
    } catch (error: any) {
      return createErrorResult('ADD_CONTENT_ERROR', { originalError: error.message })
    }
  }

  const getDiscoveryContent = async (
    _context: AccountContext,
    discoveryId: string
  ): Promise<Result<DiscoveryContent | undefined>> => {
    try {
      const contentResult = await contentStore.list()
      if (!contentResult.success) {
        return createErrorResult('GET_CONTENT_ERROR')
      }

      const content = contentResult.data?.find(c => c.discoveryId === discoveryId)
      return createSuccessResult(content)
    } catch (error: any) {
      return createErrorResult('GET_CONTENT_ERROR', { originalError: error.message })
    }
  }

  const updateDiscoveryContent = async (
    context: AccountContext,
    discoveryId: string,
    content: { imageUrl?: string; comment?: string }
  ): Promise<Result<DiscoveryContent>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get existing content
      const existingResult = await getDiscoveryContent(context, discoveryId)
      if (!existingResult.data) {
        return createErrorResult('CONTENT_NOT_FOUND')
      }

      // Verify ownership
      if (existingResult.data.accountId !== accountId) {
        return createErrorResult('NOT_AUTHORIZED')
      }

      // Handle image upload if base64 data provided
      let finalImageUrl = content.imageUrl
      if (content.imageUrl && content.imageUrl.startsWith('data:image')) {
        if (!imageApplication) {
          return createErrorResult('STORAGE_CONNECTOR_NOT_CONFIGURED')
        }

        const uploadResult = await imageApplication.uploadImage(context, 'discovery', discoveryId, content.imageUrl)
        if (!uploadResult.success || !uploadResult.data) {
          return createErrorResult('IMAGE_UPLOAD_ERROR')
        }
        finalImageUrl = uploadResult.data
      }

      const updated = discoveryService.updateDiscoveryContent(existingResult.data, {
        ...content,
        imageUrl: finalImageUrl,
      })
      const saveResult = await contentStore.update(updated.id, updated)
      if (!saveResult.success) {
        return createErrorResult('UPDATE_CONTENT_ERROR')
      }

      return createSuccessResult(updated)
    } catch (error: any) {
      return createErrorResult('UPDATE_CONTENT_ERROR', { originalError: error.message })
    }
  }

  const deleteDiscoveryContent = async (
    context: AccountContext,
    discoveryId: string
  ): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get existing content
      const existingResult = await getDiscoveryContent(context, discoveryId)
      if (!existingResult.data) {
        return createErrorResult('CONTENT_NOT_FOUND')
      }

      // Verify ownership
      if (existingResult.data.accountId !== accountId) {
        return createErrorResult('NOT_AUTHORIZED')
      }

      // Delete associated image if exists
      if (existingResult.data.imageUrl && imageApplication) {
        const deleteImageResult = await imageApplication.deleteImage(context, existingResult.data.imageUrl)
        if (!deleteImageResult.success) {
          // Log error but continue with content deletion
          console.warn('Failed to delete associated image:', deleteImageResult.error)
        }
      }

      // Delete the content
      const deleteResult = await contentStore.delete(existingResult.data.id)
      if (!deleteResult.success) {
        return createErrorResult('DELETE_CONTENT_ERROR')
      }

      return createSuccessResult(undefined)
    } catch (error: any) {
      return createErrorResult('DELETE_CONTENT_ERROR', { originalError: error.message })
    }
  }

  // Reaction methods (like/dislike)
  const reactToDiscovery = async (
    context: AccountContext,
    discoveryId: string,
    reaction: 'like' | 'dislike'
  ): Promise<Result<DiscoveryReaction>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Remove existing reaction if any
      const existingResult = await reactionStore.list()
      const existing = existingResult.data?.find(r => r.discoveryId === discoveryId && r.accountId === accountId)
      if (existing) {
        await reactionStore.delete(existing.id)
      }

      const newReaction = discoveryService.createReaction(accountId, discoveryId, reaction)
      const saveResult = await reactionStore.create(newReaction)
      if (!saveResult.success) {
        return createErrorResult('SAVE_REACTION_ERROR')
      }

      return createSuccessResult(newReaction)
    } catch (error: any) {
      return createErrorResult('REACT_ERROR', { originalError: error.message })
    }
  }

  const removeReaction = async (context: AccountContext, discoveryId: string): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const existingResult = await reactionStore.list()
      const existing = existingResult.data?.find(r => r.discoveryId === discoveryId && r.accountId === accountId)
      if (existing) {
        await reactionStore.delete(existing.id)
      }

      return createSuccessResult(undefined)
    } catch (error: any) {
      return createErrorResult('REMOVE_REACTION_ERROR', { originalError: error.message })
    }
  }

  const getReactionSummary = async (context: AccountContext, discoveryId: string): Promise<Result<ReactionSummary>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const reactionsResult = await reactionStore.list()
      if (!reactionsResult.success) {
        return createErrorResult('GET_REACTIONS_ERROR')
      }

      const summary = discoveryService.getReactionSummary(discoveryId, reactionsResult.data || [], accountId)
      return createSuccessResult(summary)
    } catch (error: any) {
      return createErrorResult('GET_REACTION_SUMMARY_ERROR', { originalError: error.message })
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
    addDiscoveryContent,
    getDiscoveryContent,
    updateDiscoveryContent,
    deleteDiscoveryContent,
    reactToDiscovery,
    removeReaction,
    getReactionSummary,
  }
}

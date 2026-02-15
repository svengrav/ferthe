import { extractBlobPathFromUrl } from '@core/shared/images/imageService.ts'
import { Store } from '@core/store/storeFactory.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { createSlug } from '@core/utils/slug.ts'
import {
  AccountContext,
  Discovery,
  ImageApplicationContract,
  ImageReference,
  Result,
  Spot,
  SpotPreview,
  StoredSpot,
  StoredTrail,
  Trail,
  TrailApplicationContract,
  TrailSpot,
  TrailStats
} from '@shared/contracts/index.ts'
import { geoUtils } from '@shared/geo/index.ts'
import { createTrailService } from './trailService.ts'

interface TrailApplicationOptions {
  trailStore: Store<StoredTrail>
  spotStore: Store<StoredSpot>
  trailSpotStore: Store<TrailSpot>
  discoveryStore: Store<Discovery>
  imageApplication: ImageApplicationContract
}

/**
 * Enrich trail entity with fresh image URLs
 */
async function enrichTrailWithImages(
  context: AccountContext,
  trailEntity: StoredTrail,
  imageApplication: ImageApplicationContract
): Promise<Trail> {
  let image: { id: string; url: string } | undefined
  let mapImage: { id: string; url: string } | undefined

  // Generate fresh URL for trail image
  if (trailEntity.imageBlobPath) {
    const urlResult = await imageApplication.refreshImageUrl(context, trailEntity.imageBlobPath)
    if (urlResult.success && urlResult.data) {
      image = {
        id: trailEntity.imageBlobPath,
        url: urlResult.data,
      }
    }
  }

  // Generate fresh URL for map image
  if (trailEntity.map.imageBlobPath) {
    const mapUrlResult = await imageApplication.refreshImageUrl(context, trailEntity.map.imageBlobPath)
    if (mapUrlResult.success && mapUrlResult.data) {
      mapImage = {
        id: trailEntity.map.imageBlobPath,
        url: mapUrlResult.data,
      }
    }
  }

  return {
    id: trailEntity.id,
    slug: trailEntity.slug,
    name: trailEntity.name,
    description: trailEntity.description,
    map: {
      image: mapImage,
    },
    image,
    boundary: trailEntity.boundary || { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } },
    options: trailEntity.options,
    createdAt: trailEntity.createdAt,
    updatedAt: trailEntity.updatedAt,
  }
}

/**
 * Enrich spot entity with fresh image URLs
 */
async function enrichSpotWithImages(
  context: AccountContext,
  spotEntity: StoredSpot,
  imageApplication: ImageApplicationContract
): Promise<Spot> {
  let image: ImageReference | undefined
  let blurredImage: ImageReference | undefined

  if (spotEntity.imageBlobPath) {
    const urlResult = await imageApplication.refreshImageUrl(context, spotEntity.imageBlobPath)

    if (urlResult.success && urlResult.data) {
      image = {
        id: spotEntity.imageBlobPath,
        url: urlResult.data,
      }
    }
  }

  // Load blurred image separately (for undiscovered spots)
  if (spotEntity.blurredImageBlobPath) {
    const blurredResult = await imageApplication.refreshImageUrl(context, spotEntity.blurredImageBlobPath)
    if (blurredResult.success && blurredResult.data) {
      blurredImage = {
        id: spotEntity.blurredImageBlobPath,
        url: blurredResult.data,
      }
    }
  }

  return {
    id: spotEntity.id,
    slug: spotEntity.slug,
    name: spotEntity.name,
    description: spotEntity.description,
    image,
    blurredImage,
    location: spotEntity.location,
    options: spotEntity.options,
    createdAt: spotEntity.createdAt,
    updatedAt: spotEntity.updatedAt,
  }
}

/**
 * Helper: Enrich trail with calculated boundary from spots
 * @param trailEntity Trail entity to enrich
 * @param trailSpotStore Store for trail-spot relationships
 * @param spotStore Store for spot entities
 * @returns Trail entity with boundary calculated from its spots
 */
async function enrichTrailWithBoundary(
  trailEntity: StoredTrail,
  trailSpotStore: Store<TrailSpot>,
  spotStore: Store<StoredSpot>
): Promise<StoredTrail> {
  // If boundary already exists, return as-is
  if (trailEntity.boundary) {
    return trailEntity
  }

  // Get spots for this trail
  const trailSpotsResult = await trailSpotStore.list()
  if (!trailSpotsResult.success) {
    return trailEntity // Return original if can't fetch trail-spots
  }

  const spotIds = (trailSpotsResult.data || [])
    .filter(ts => ts.trailId === trailEntity.id)
    .map(ts => ts.spotId)

  if (spotIds.length === 0) {
    return trailEntity // No spots, return original
  }

  // Fetch actual spot entities
  const spotsResult = await spotStore.list()
  if (!spotsResult.success) {
    return trailEntity
  }

  const spotEntities = (spotsResult.data || []).filter(spot => spotIds.includes(spot.id))

  if (spotEntities.length === 0) {
    return trailEntity
  }

  // Calculate boundary from spot locations
  const boundary = geoUtils.calculateSpotBoundingBox(spotEntities.map(s => ({ ...s, image: undefined })), 50)

  return {
    ...trailEntity,
    boundary
  }
}

export function createTrailApplication({ trailStore, spotStore, trailSpotStore, discoveryStore, imageApplication }: TrailApplicationOptions): TrailApplicationContract {
  const trailService = createTrailService()

  return {
    listSpotPreviews: async (context: AccountContext, trailId?: string): Promise<Result<SpotPreview[]>> => {
      try {
        if (!trailId) {
          const spotsResult = await spotStore.list()
          if (!spotsResult.success) {
            return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_PREVIEWS_ERROR' } }
          }

          // Enrich with blurred image URLs
          const enrichedPreviews = await Promise.all(
            (spotsResult.data || []).map(async (spotEntity) => {
              const preview: SpotPreview = { id: spotEntity.id }

              if (spotEntity.blurredImageBlobPath) {
                const blurredUrlResult = await imageApplication.refreshImageUrl(context, spotEntity.blurredImageBlobPath)
                if (blurredUrlResult.success && blurredUrlResult.data) {
                  preview.blurredImage = {
                    id: spotEntity.blurredImageBlobPath,
                    url: blurredUrlResult.data,
                  }
                }
              }

              return preview
            })
          )

          return { success: true, data: enrichedPreviews }
        }

        // Get trail-spot relationships
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to list trail spots', code: 'GET_SPOT_PREVIEWS_ERROR' } }
        }

        const trailSpots = (trailSpotsResult.data || []).filter(ts => ts.trailId === trailId)
        const spotIds = trailSpots.map(ts => ts.spotId)

        // Get spot entities
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_PREVIEWS_ERROR' } }
        }

        const spotEntities = (spotsResult.data || []).filter(spot => spotIds.includes(spot.id))

        // Enrich with blurred image URLs
        const enrichedPreviews = await Promise.all(
          spotEntities.map(async (spotEntity) => {
            const preview: SpotPreview = { id: spotEntity.id }

            if (spotEntity.blurredImageBlobPath) {
              const blurredUrlResult = await imageApplication.refreshImageUrl(context, spotEntity.blurredImageBlobPath)
              if (blurredUrlResult.success && blurredUrlResult.data) {
                preview.blurredImage = {
                  id: spotEntity.blurredImageBlobPath,
                  url: blurredUrlResult.data,
                }
              }
            }

            return preview
          })
        )

        return { success: true, data: enrichedPreviews }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_SPOT_PREVIEWS_ERROR' } }
      }
    },

    getSpot: async (context: AccountContext, spotId: string): Promise<Result<Spot | undefined>> => {
      try {
        const spotResult = await spotStore.get(spotId)
        if (!spotResult.success) {
          return { success: false, error: { message: 'Failed to get spot', code: 'GET_SPOT_ERROR' } }
        }

        if (!spotResult.data) {
          return { success: true, data: undefined }
        }

        // Enrich with fresh image URLs
        const enrichedSpot = await enrichSpotWithImages(context, spotResult.data, imageApplication)
        return { success: true, data: enrichedSpot }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_SPOT_ERROR' } }
      }
    },

    getTrail: async (context: AccountContext, trailId: string): Promise<Result<Trail | undefined>> => {
      try {
        const trailResult = await trailStore.get(trailId)
        if (!trailResult.success) {
          return { success: false, error: { message: 'Failed to get trail', code: 'GET_TRAIL_ERROR' } }
        }

        if (!trailResult.data) {
          return { success: true, data: undefined }
        }

        // Enrich trail with calculated boundary
        const enrichedWithBoundary = await enrichTrailWithBoundary(trailResult.data, trailSpotStore, spotStore)

        // Enrich with fresh image URLs
        const enrichedTrail = await enrichTrailWithImages(context, enrichedWithBoundary, imageApplication)

        return { success: true, data: enrichedTrail }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_TRAIL_ERROR' } }
      }
    },

    getTrailSpotIds: async (context: AccountContext, trailId: string): Promise<Result<string[]>> => {
      try {
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to list trail spots', code: 'GET_TRAIL_SPOT_IDS_ERROR' } }
        }

        const trailSpots = (trailSpotsResult.data || [])
          .filter(ts => ts.trailId === trailId)
          .sort((a, b) => {
            // Sort by order if available, otherwise by createdAt
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order
            }
            if (a.order !== undefined) return -1
            if (b.order !== undefined) return 1
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })

        return { success: true, data: trailSpots.map(ts => ts.spotId) }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_TRAIL_SPOT_IDS_ERROR' } }
      }
    },

    listTrails: async (context: AccountContext): Promise<Result<Trail[]>> => {
      try {
        const trailsResult = await trailStore.list()
        if (!trailsResult.success) {
          return { success: false, error: { message: 'Failed to list trails', code: 'LIST_TRAILS_ERROR' } }
        }

        const trailEntities = trailsResult.data || []

        // Enrich each trail with calculated boundary and fresh image URLs
        const enrichedTrails = await Promise.all(
          trailEntities.map(async (trailEntity) => {
            const withBoundary = await enrichTrailWithBoundary(trailEntity, trailSpotStore, spotStore)
            return enrichTrailWithImages(context, withBoundary, imageApplication)
          })
        )

        return { success: true, data: enrichedTrails }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'LIST_TRAILS_ERROR' } }
      }
    },

    listSpots: async (context: AccountContext, trailId?: string): Promise<Result<Spot[]>> => {
      try {
        if (!trailId) {
          const spotsResult = await spotStore.list()
          if (!spotsResult.success) {
            return { success: false, error: { message: 'Failed to list spots', code: 'LIST_SPOTS_ERROR' } }
          }

          // Enrich all spots with fresh image URLs
          const enrichedSpots = await Promise.all(
            (spotsResult.data || []).map(spotEntity => enrichSpotWithImages(context, spotEntity, imageApplication))
          )

          return { success: true, data: enrichedSpots }
        }

        // Get trail-spot relationships
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to list trail spots', code: 'LIST_SPOTS_ERROR' } }
        }

        const trailSpots = (trailSpotsResult.data || []).filter(ts => ts.trailId === trailId)
        const spotIds = trailSpots.map(ts => ts.spotId)

        // Get spot entities
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'LIST_SPOTS_ERROR' } }
        }

        const spotEntities = (spotsResult.data || []).filter(spot => spotIds.includes(spot.id))

        // Enrich with fresh image URLs
        const enrichedSpots = await Promise.all(
          spotEntities.map(spotEntity => enrichSpotWithImages(context, spotEntity, imageApplication))
        )

        return { success: true, data: enrichedSpots }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'LIST_SPOTS_ERROR' } }
      }
    },

    getTrailStats: async (context: AccountContext, trailId: string): Promise<Result<TrailStats>> => {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return { success: false, error: { message: 'Account ID is required', code: 'ACCOUNT_ID_REQUIRED' } }
        }

        // Verify trail exists
        const trailResult = await trailStore.get(trailId)
        if (!trailResult.success || !trailResult.data) {
          return { success: false, error: { message: 'Trail not found', code: 'TRAIL_NOT_FOUND' } }
        }

        // Get trail spot IDs
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to retrieve trail spots', code: 'GET_TRAIL_SPOTS_ERROR' } }
        }

        const trailSpotIds = (trailSpotsResult.data || [])
          .filter(ts => ts.trailId === trailId)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(ts => ts.spotId)

        if (trailSpotIds.length === 0) {
          return { success: false, error: { message: 'Trail has no spots', code: 'TRAIL_HAS_NO_SPOTS' } }
        }

        // Get all discoveries
        const discoveriesResult = await discoveryStore.list()
        if (!discoveriesResult.success) {
          return { success: false, error: { message: 'Failed to retrieve discoveries', code: 'GET_DISCOVERIES_ERROR' } }
        }

        const allDiscoveries = discoveriesResult.data || []

        // Calculate stats using service
        const stats = trailService.getTrailStats(accountId, trailId, allDiscoveries, trailSpotIds)

        return { success: true, data: stats }
      } catch (error: any) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_TRAIL_STATS_ERROR' } }
      }
    },

    createTrail: async (context: AccountContext, trailData: Omit<Trail, 'id' | 'slug'>): Promise<Result<Trail>> => {
      try {
        const id = createCuid2()
        const slug = createSlug(trailData.name)

        // Convert Trail input to StoredTrail (extract blob paths from URLs)
        const trailEntity: StoredTrail = {
          id,
          slug,
          name: trailData.name,
          description: trailData.description,
          map: {
            imageBlobPath: trailData.map.image?.url ? extractBlobPathFromUrl(trailData.map.image.url) : undefined,
          },
          imageBlobPath: trailData.image?.url ? extractBlobPathFromUrl(trailData.image.url) : undefined,
          boundary: trailData.boundary,
          options: trailData.options,
          createdAt: trailData.createdAt,
          updatedAt: trailData.updatedAt,
        }

        // Store entity with blob paths
        const createdTrailResult = await trailStore.create(trailEntity)
        if (!createdTrailResult.success) {
          return { success: false, error: { message: 'Failed to create trail', code: 'CREATE_TRAIL_ERROR' } }
        }

        // Return enriched trail with fresh URLs
        const enrichedTrail = await enrichTrailWithImages(context, createdTrailResult.data!, imageApplication)
        return { success: true, data: enrichedTrail }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'CREATE_TRAIL_ERROR' } }
      }
    },

    createSpot: async (context: AccountContext, spotData: Omit<Spot, 'id' | 'slug'>): Promise<Result<Spot>> => {
      try {
        const id = createCuid2()
        const slug = createSlug(spotData.name)

        // Extract blob path from image URL
        const imageBlobPath = spotData.image?.url ? extractBlobPathFromUrl(spotData.image.url) : undefined

        // Auto-generate blurred path if image exists (by convention: <path>-blurred.<ext>)
        let blurredImageBlobPath: string | undefined
        if (imageBlobPath) {
          const lastDot = imageBlobPath.lastIndexOf('.')
          blurredImageBlobPath = lastDot === -1
            ? `${imageBlobPath}-blurred`
            : `${imageBlobPath.substring(0, lastDot)}-blurred${imageBlobPath.substring(lastDot)}`
        }

        // Convert Spot input to StoredSpot
        const spotEntity: StoredSpot = {
          id,
          slug,
          name: spotData.name,
          description: spotData.description,
          imageBlobPath,
          blurredImageBlobPath,
          location: spotData.location,
          options: spotData.options,
          createdAt: spotData.createdAt,
          updatedAt: spotData.updatedAt,
        }

        // Store entity with blob paths
        const createdSpotResult = await spotStore.create(spotEntity)
        if (!createdSpotResult.success) {
          return { success: false, error: { message: 'Failed to create spot', code: 'CREATE_SPOT_ERROR' } }
        }

        // Return enriched spot with fresh URLs
        const enrichedSpot = await enrichSpotWithImages(context, createdSpotResult.data!, imageApplication)
        return { success: true, data: enrichedSpot }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'CREATE_SPOT_ERROR' } }
      }
    },

    addSpotToTrail: async (context: AccountContext, trailId: string, spotId: string, order?: number): Promise<Result<TrailSpot>> => {
      try {
        // Check if relationship already exists
        const existingResult = await trailSpotStore.list()
        if (existingResult.success) {
          const existing = (existingResult.data || []).find(ts => ts.trailId === trailId && ts.spotId === spotId)
          if (existing) {
            return { success: false, error: { message: 'Spot already added to trail', code: 'SPOT_ALREADY_IN_TRAIL' } }
          }
        }

        const trailSpot: TrailSpot = {
          id: createCuid2(),
          trailId,
          spotId,
          order,
          createdAt: new Date(),
        }

        const result = await trailSpotStore.create(trailSpot)
        if (!result.success) {
          return { success: false, error: { message: 'Failed to add spot to trail', code: 'ADD_SPOT_TO_TRAIL_ERROR' } }
        }
        return { success: true, data: result.data! }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'ADD_SPOT_TO_TRAIL_ERROR' } }
      }
    },

    removeSpotFromTrail: async (context: AccountContext, trailId: string, spotId: string): Promise<Result<void>> => {
      try {
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to list trail spots', code: 'REMOVE_SPOT_FROM_TRAIL_ERROR' } }
        }

        const trailSpot = (trailSpotsResult.data || []).find(ts => ts.trailId === trailId && ts.spotId === spotId)
        if (!trailSpot) {
          return { success: false, error: { message: 'Spot not found in trail', code: 'SPOT_NOT_IN_TRAIL' } }
        }

        const deleteResult = await trailSpotStore.delete(trailSpot.id)
        if (!deleteResult.success) {
          return { success: false, error: { message: 'Failed to remove spot from trail', code: 'REMOVE_SPOT_FROM_TRAIL_ERROR' } }
        }

        return { success: true, data: undefined }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'REMOVE_SPOT_FROM_TRAIL_ERROR' } }
      }
    },
  }
}

import { extractBlobPathFromUrl } from '@core/shared/images/imageService.ts'
import { Store } from '@core/store/storeFactory.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { createSlug } from '@core/utils/slug.ts'
import {
  AccountContext,
  ImageApplicationContract,
  QueryOptions,
  RatingSummary,
  Result,
  SpotApplicationContract,
  StoredTrail,
  StoredTrailSpot,
  Trail,
  TrailApplicationContract,
  TrailRating,
  TrailSpot
} from '@shared/contracts/index.ts'
import { geoUtils } from '@shared/geo/index.ts'

interface TrailApplicationOptions {
  trailStore: Store<StoredTrail>
  trailSpotStore: Store<StoredTrailSpot>
  trailRatingStore: Store<TrailRating>
  imageApplication: ImageApplicationContract
  spotApplication: SpotApplicationContract
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
  let viewportImage: { id: string; url: string } | undefined
  let overviewImage: { id: string; url: string } | undefined

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

  // Generate fresh URL for viewport image
  if (trailEntity.viewport?.imageBlobPath) {
    const viewportUrlResult = await imageApplication.refreshImageUrl(context, trailEntity.viewport.imageBlobPath)
    if (viewportUrlResult.success && viewportUrlResult.data) {
      viewportImage = {
        id: trailEntity.viewport.imageBlobPath,
        url: viewportUrlResult.data,
      }
    }
  }

  // Generate fresh URL for overview image
  if (trailEntity.overview?.imageBlobPath) {
    const overviewUrlResult = await imageApplication.refreshImageUrl(context, trailEntity.overview.imageBlobPath)
    if (overviewUrlResult.success && overviewUrlResult.data) {
      overviewImage = {
        id: trailEntity.overview.imageBlobPath,
        url: overviewUrlResult.data,
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
    viewport: viewportImage ? {
      image: viewportImage,
    } : undefined,
    overview: overviewImage ? {
      image: overviewImage,
    } : undefined,
    image,
    boundary: trailEntity.boundary || { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } },
    options: trailEntity.options,
    createdBy: trailEntity.createdBy,
    createdAt: trailEntity.createdAt,
    updatedAt: trailEntity.updatedAt,
  }
}

/**
 * Helper: Enrich trail with calculated boundary from spots
 * @param context Account context for authentication
 * @param trailEntity Trail entity to enrich
 * @param trailSpotStore Store for trail-spot relationships
 * @param spotApplication SpotApplication for fetching spot data
 * @returns Trail entity with boundary calculated from its spots
 */
async function enrichTrailWithBoundary(
  context: AccountContext,
  trailEntity: StoredTrail,
  trailSpotStore: Store<StoredTrailSpot>,
  spotApplication: SpotApplicationContract
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

  // Fetch actual spot entities via SpotApplication
  const spotsResult = await spotApplication.getSpotsByIds(context, spotIds, { exclude: ['images', 'userStatus'] })
  if (!spotsResult.success || !spotsResult.data) {
    return trailEntity
  }

  if (spotsResult.data.length === 0) {
    return trailEntity
  }

  // Calculate boundary from spot locations
  const boundary = geoUtils.calculateSpotBoundingBox(spotsResult.data.map(s => ({ ...s, image: undefined })), 50)

  return {
    ...trailEntity,
    boundary
  }
}

export function createTrailApplication({ trailStore, trailSpotStore, trailRatingStore, imageApplication, spotApplication }: TrailApplicationOptions): TrailApplicationContract {
  return {
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
        const enrichedWithBoundary = await enrichTrailWithBoundary(context, trailResult.data, trailSpotStore, spotApplication)

        // Enrich with fresh image URLs
        const enrichedTrail = await enrichTrailWithImages(context, enrichedWithBoundary, imageApplication)

        return { success: true, data: enrichedTrail }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_TRAIL_ERROR' } }
      }
    },

    getTrailSpotIds: async (_context: AccountContext, trailId: string): Promise<Result<string[]>> => {
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

        // Deduplicate spot IDs (guards against duplicate store entries)
        const seen = new Set<string>()
        const uniqueSpotIds = trailSpots
          .map(ts => ts.spotId)
          .filter(id => seen.has(id) ? false : (seen.add(id), true))

        return { success: true, data: uniqueSpotIds }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_TRAIL_SPOT_IDS_ERROR' } }
      }
    },

    getTrailSpots: async (context: AccountContext, trailId: string): Promise<Result<TrailSpot[]>> => {
      try {
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to get trail spots', code: 'GET_TRAIL_SPOTS_ERROR' } }
        }

        const sortedTrailSpots = (trailSpotsResult.data || [])
          .filter(ts => ts.trailId === trailId)
          .sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) return a.order - b.order
            if (a.order !== undefined) return -1
            if (b.order !== undefined) return 1
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })

        const spotIds = sortedTrailSpots.map(ts => ts.spotId)

        // Load spot previews (safe, limited data)
        const previewsResult = await spotApplication.getSpotPreviewsByIds(context, spotIds)
        if (!previewsResult.success) {
          return { success: false, error: { message: 'Failed to load spot previews', code: 'GET_SPOT_PREVIEWS_ERROR' } }
        }

        const previewsById = Object.fromEntries(
          (previewsResult.data || []).map(p => [p.id, p])
        )

        // Map to TrailSpot DTOs with preview data
        const trailSpots: TrailSpot[] = sortedTrailSpots.map((ts, index) => ({
          spotId: ts.spotId,
          order: ts.order ?? index,
          preview: previewsById[ts.spotId] ? {
            blurredImage: previewsById[ts.spotId].blurredImage,
            rating: previewsById[ts.spotId].rating,
          } : undefined,
        }))

        return { success: true, data: trailSpots }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_TRAIL_SPOTS_ERROR' } }
      }
    },

    listTrails: async (context: AccountContext, options?: QueryOptions): Promise<Result<Trail[]>> => {
      try {
        const trailsResult = await trailStore.list(options)
        if (!trailsResult.success) {
          return { success: false, error: { message: 'Failed to list trails', code: 'LIST_TRAILS_ERROR' } }
        }

        const trailEntities = trailsResult.data || []

        // Check if images should be enriched
        // Default: enrich unless explicitly excluded or not included
        const shouldEnrichImages = options?.exclude?.includes('images') ? false :
          (options?.include ? options.include.includes('images') : true)

        // Enrich each trail with calculated boundary and optionally with fresh image URLs
        const enrichedTrails = await Promise.all(
          trailEntities.map(async (trailEntity) => {
            const withBoundary = await enrichTrailWithBoundary(context, trailEntity, trailSpotStore, spotApplication)
            if (shouldEnrichImages) {
              return enrichTrailWithImages(context, withBoundary, imageApplication)
            }
            // Return trail without image enrichment
            return {
              id: withBoundary.id,
              slug: withBoundary.slug,
              name: withBoundary.name,
              description: withBoundary.description,
              map: { image: undefined },
              viewport: undefined,
              overview: undefined,
              image: undefined,
              boundary: withBoundary.boundary || { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } },
              options: withBoundary.options,
              createdBy: withBoundary.createdBy,
              createdAt: withBoundary.createdAt,
              updatedAt: withBoundary.updatedAt,
            }
          })
        )

        return { success: true, data: enrichedTrails }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'LIST_TRAILS_ERROR' } }
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
          viewport: trailData.viewport ? {
            imageBlobPath: trailData.viewport.image?.url ? extractBlobPathFromUrl(trailData.viewport.image.url) : undefined,
          } : undefined,
          overview: trailData.overview ? {
            imageBlobPath: trailData.overview.image?.url ? extractBlobPathFromUrl(trailData.overview.image.url) : undefined,
          } : undefined,
          imageBlobPath: trailData.image?.url ? extractBlobPathFromUrl(trailData.image.url) : undefined,
          boundary: trailData.boundary,
          options: trailData.options,
          createdBy: trailData.createdBy,
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

    addSpotToTrail: async (_context: AccountContext, trailId: string, spotId: string, order?: number): Promise<Result<StoredTrailSpot>> => {
      try {
        // Check if relationship already exists
        const existingResult = await trailSpotStore.list()
        if (existingResult.success) {
          const existing = (existingResult.data || []).find(ts => ts.trailId === trailId && ts.spotId === spotId)
          if (existing) {
            return { success: false, error: { message: 'Spot already added to trail', code: 'SPOT_ALREADY_IN_TRAIL' } }
          }
        }

        const trailSpot: StoredTrailSpot = {
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

    removeSpotFromTrail: async (_context: AccountContext, trailId: string, spotId: string): Promise<Result<void>> => {
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

    rateTrail: async (context: AccountContext, trailId: string, rating: number): Promise<Result<TrailRating>> => {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return { success: false, error: { message: 'Account ID required', code: 'ACCOUNT_ID_REQUIRED' } }
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
          return { success: false, error: { message: 'Rating must be between 1 and 5', code: 'INVALID_RATING' } }
        }

        // Remove existing rating if any
        const existingResult = await trailRatingStore.list()
        const existing = existingResult.data?.find(r => r.trailId === trailId && r.accountId === accountId)
        if (existing) {
          await trailRatingStore.delete(existing.id)
        }

        const newRating: TrailRating = {
          id: createCuid2(),
          trailId,
          accountId,
          rating,
          createdAt: new Date(),
        }

        const saveResult = await trailRatingStore.create(newRating)
        if (!saveResult.success) {
          return { success: false, error: { message: 'Failed to save rating', code: 'SAVE_RATING_ERROR' } }
        }

        return { success: true, data: newRating }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'RATE_TRAIL_ERROR' } }
      }
    },

    removeTrailRating: async (context: AccountContext, trailId: string): Promise<Result<void>> => {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return { success: false, error: { message: 'Account ID required', code: 'ACCOUNT_ID_REQUIRED' } }
        }

        const existingResult = await trailRatingStore.list()
        const existing = existingResult.data?.find(r => r.trailId === trailId && r.accountId === accountId)
        if (existing) {
          await trailRatingStore.delete(existing.id)
        }

        return { success: true, data: undefined }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'REMOVE_RATING_ERROR' } }
      }
    },

    getTrailRatingSummary: async (context: AccountContext, trailId: string): Promise<Result<RatingSummary>> => {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return { success: false, error: { message: 'Account ID required', code: 'ACCOUNT_ID_REQUIRED' } }
        }

        const ratingsResult = await trailRatingStore.list()
        if (!ratingsResult.success) {
          return { success: false, error: { message: 'Failed to get ratings', code: 'GET_RATINGS_ERROR' } }
        }

        const trailRatings = (ratingsResult.data || []).filter(r => r.trailId === trailId)
        const userRating = trailRatings.find(r => r.accountId === accountId)?.rating

        const count = trailRatings.length
        const average = count > 0
          ? trailRatings.reduce((sum, r) => sum + r.rating, 0) / count
          : 0

        const summary: RatingSummary = {
          average: Math.round(average * 10) / 10, // Round to 1 decimal
          count,
          userRating,
        }

        return { success: true, data: summary }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_RATING_SUMMARY_ERROR' } }
      }
    },
  }
}

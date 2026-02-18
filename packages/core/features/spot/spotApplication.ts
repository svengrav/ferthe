import { extractBlobPathFromUrl } from '@core/shared/images/imageService.ts'
import { Store } from '@core/store/storeFactory.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { createSlug } from '@core/utils/slug.ts'
import { ERROR_CODES } from '@shared/contracts/errors.ts'
import { AccountContext, ImageApplicationContract, QueryOptions, RatingSummary, Result, Spot, SpotApplicationContract, SpotPreview, SpotRating, StoredSpot } from '@shared/contracts/index.ts'
import { enrichSpotWithImages } from './spotEnrichment.ts'

export interface SpotApplicationActions extends SpotApplicationContract { }

export interface SpotApplicationConfig {
  spotStore: Store<StoredSpot>
  ratingStore: Store<SpotRating>
  imageApplication: ImageApplicationContract
}

export function createSpotApplication(config: SpotApplicationConfig): SpotApplicationActions {
  const { spotStore, ratingStore, imageApplication } = config

  // Helper function to calculate rating summary for a spot
  const calculateRatingSummary = (spotId: string, allRatings: SpotRating[], accountId?: string): RatingSummary => {
    const spotRatings = allRatings.filter(r => r.spotId === spotId)
    const userRating = accountId ? spotRatings.find(r => r.accountId === accountId) : undefined

    return {
      average: spotRatings.length > 0
        ? spotRatings.reduce((sum, r) => sum + r.rating, 0) / spotRatings.length
        : 0,
      count: spotRatings.length,
      userRating: userRating?.rating,
    }
  }

  return {
    async getSpots(context?: AccountContext, options?: QueryOptions): Promise<Result<Spot[]>> {
      try {
        const spotsResult = await spotStore.list(options)
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOTS_ERROR' } }
        }

        let spots = spotsResult.data || []

        // Check if images should be enriched
        const shouldEnrichImages = options?.exclude?.includes('images') ? false :
          (options?.include ? options.include.includes('images') : true)

        if (shouldEnrichImages && context) {
          spots = await Promise.all(
            spots.map(spotEntity => enrichSpotWithImages(context, spotEntity, imageApplication))
          )
        }

        return { success: true, data: spots }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOTS_ERROR' } }
      }
    },

    async getSpot(context: AccountContext, id: string, options?: QueryOptions): Promise<Result<Spot | undefined>> {
      try {
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_ERROR' } }
        }
        const spots = spotsResult.data || []
        const spotEntity = spots.find(s => s.id === id)

        if (!spotEntity) {
          return { success: true, data: undefined }
        }

        // Check if images should be enriched
        const shouldEnrichImages = options?.exclude?.includes('images') ? false :
          (options?.include ? options.include.includes('images') : true)

        const spot = shouldEnrichImages
          ? await enrichSpotWithImages(context, spotEntity, imageApplication)
          : spotEntity

        return { success: true, data: spot }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOT_ERROR' } }
      }
    },

    async getSpotsByIds(context: AccountContext, spotIds: string[], options?: QueryOptions): Promise<Result<Spot[]>> {
      try {
        if (!spotIds || spotIds.length === 0) {
          return { success: true, data: [] }
        }

        const queryOptions = {
          ...options,
          filters: { ...options?.filters, id: spotIds },
        }

        const spotsResult = await spotStore.list(queryOptions)
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots by IDs', code: 'GET_SPOTS_ERROR' } }
        }

        let spots = spotsResult.data || []

        // Check if images should be enriched
        const shouldEnrichImages = options?.exclude?.includes('images') ? false :
          (options?.include ? options.include.includes('images') : true)

        if (shouldEnrichImages) {
          spots = await Promise.all(
            spots.map(spotEntity => enrichSpotWithImages(context, spotEntity, imageApplication))
          )
        }

        return { success: true, data: spots }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOTS_ERROR' } }
      }
    },

    async createSpot(context: AccountContext, spotData: Omit<Spot, 'id' | 'slug'>): Promise<Result<Spot>> {
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
    getSpotPreviews: async (options?: QueryOptions): Promise<Result<SpotPreview[]>> => {
      try {
        const spotsResult = await spotStore.list(options)
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spot previews', code: 'GET_SPOT_PREVIEWS_ERROR' } }
        }

        // Load all ratings once (batch loading)
        const ratingsResult = await ratingStore.list()
        const allRatings = ratingsResult.success ? (ratingsResult.data || []) : []

        const previews = (spotsResult.data || []).map(spot => ({
          id: spot.id,
          blurredImage: spot.blurredImage,
          rating: calculateRatingSummary(spot.id, allRatings),
        }))

        return { success: true, data: previews }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOT_PREVIEWS_ERROR' } }
      }
    },

    getSpotPreviewsByIds: async (context: AccountContext, spotIds: string[], options?: QueryOptions): Promise<Result<SpotPreview[]>> => {
      try {
        if (!spotIds || spotIds.length === 0) {
          return { success: true, data: [] }
        }

        const queryOptions = {
          ...options,
          filters: { ...options?.filters, id: spotIds },
        }

        const spotsResult = await spotStore.list(queryOptions)
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spot previews by IDs', code: 'GET_SPOT_PREVIEWS_ERROR' } }
        }

        // Load all ratings once (batch loading)
        const ratingsResult = await ratingStore.list()
        const allRatings = ratingsResult.success ? (ratingsResult.data || []) : []

        const previews = await Promise.all(
          (spotsResult.data || []).map(async (spotEntity) => {
            const preview: SpotPreview = {
              id: spotEntity.id,
              rating: calculateRatingSummary(spotEntity.id, allRatings, context.accountId),
            }

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

        return { success: true, data: previews }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOT_PREVIEWS_ERROR' } }
      }
    },

    // Rating methods
    rateSpot: async (
      context: AccountContext,
      spotId: string,
      rating: number
    ): Promise<Result<SpotRating>> => {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return { success: false, error: { message: 'Account ID required', code: 'ACCOUNT_ID_REQUIRED' } }
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
          return { success: false, error: ERROR_CODES.INVALID_RATING }
        }

        // Remove existing rating if any
        const existingResult = await ratingStore.list()
        const existing = existingResult.data?.find(r => r.spotId === spotId && r.accountId === accountId)
        if (existing) {
          await ratingStore.delete(existing.id)
        }

        // Create new rating
        const newRating: SpotRating = {
          id: createCuid2(),
          spotId,
          accountId,
          rating,
          createdAt: new Date(),
        }

        const saveResult = await ratingStore.create(newRating)
        if (!saveResult.success) {
          return { success: false, error: { message: 'Failed to save rating', code: 'SAVE_RATING_ERROR' } }
        }

        return { success: true, data: newRating }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'RATE_ERROR' } }
      }
    },

    removeSpotRating: async (context: AccountContext, spotId: string): Promise<Result<void>> => {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return { success: false, error: { message: 'Account ID required', code: 'ACCOUNT_ID_REQUIRED' } }
        }

        const existingResult = await ratingStore.list()
        const existing = existingResult.data?.find(r => r.spotId === spotId && r.accountId === accountId)
        if (existing) {
          await ratingStore.delete(existing.id)
        }

        return { success: true, data: undefined }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'REMOVE_RATING_ERROR' } }
      }
    },

    getSpotRatingSummary: async (context: AccountContext, spotId: string): Promise<Result<RatingSummary>> => {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return { success: false, error: { message: 'Account ID required', code: 'ACCOUNT_ID_REQUIRED' } }
        }

        const ratingsResult = await ratingStore.list()
        if (!ratingsResult.success) {
          return { success: false, error: { message: 'Failed to get ratings', code: 'GET_RATINGS_ERROR' } }
        }

        const allRatings = ratingsResult.data || []
        const summary = calculateRatingSummary(spotId, allRatings, accountId)

        return { success: true, data: summary }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_RATING_SUMMARY_ERROR' } }
      }
    },
  }
}

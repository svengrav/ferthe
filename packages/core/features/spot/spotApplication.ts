import { extractBlobPathFromUrl } from '@core/shared/images/imageService.ts'
import { Store } from '@core/store/storeFactory.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { createSlug } from '@core/utils/slug.ts'
import { ERROR_CODES } from '@shared/contracts/errors.ts'
import { AccountContext, CreateSpotRequest, ImageApplicationContract, QueryOptions, RatingSummary, Result, Spot, SpotApplicationContract, SpotPreview, SpotRating, StoredSpot, TrailApplicationContract, UpdateSpotRequest } from '@shared/contracts/index.ts'
import { enrichSpotWithImages } from './spotEnrichment.ts'

export interface SpotApplicationActions extends SpotApplicationContract {
  setTrailApplication: (trailApp: TrailApplicationContract) => void
}

export interface SpotApplicationConfig {
  spotStore: Store<StoredSpot>
  ratingStore: Store<SpotRating>
  imageApplication: ImageApplicationContract
}

export function createSpotApplication(config: SpotApplicationConfig): SpotApplicationActions {
  const { spotStore, ratingStore, imageApplication } = config
  let trailApplication: TrailApplicationContract | undefined

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

  // Create spot from raw Spot data (internal/admin usage)
  const createSpotFromData = async (context: AccountContext, spotData: Omit<Spot, 'id' | 'slug'>): Promise<Result<Spot>> => {
    const id = createCuid2()
    const slug = createSlug(spotData.name)

    const imageBlobPath = spotData.image?.url ? extractBlobPathFromUrl(spotData.image.url) : undefined

    let blurredImageBlobPath: string | undefined
    if (imageBlobPath) {
      const lastDot = imageBlobPath.lastIndexOf('.')
      blurredImageBlobPath = lastDot === -1
        ? `${imageBlobPath}-blurred`
        : `${imageBlobPath.substring(0, lastDot)}-blurred${imageBlobPath.substring(lastDot)}`
    }

    const spotEntity: StoredSpot = {
      id,
      slug,
      name: spotData.name,
      description: spotData.description,
      imageBlobPath,
      blurredImageBlobPath,
      location: spotData.location,
      contentBlocks: spotData.contentBlocks,
      options: spotData.options,
      createdBy: spotData.createdBy,
      createdAt: spotData.createdAt,
      updatedAt: spotData.updatedAt,
    }

    const createdSpotResult = await spotStore.create(spotEntity)
    if (!createdSpotResult.success) {
      return { success: false, error: { message: 'Failed to create spot', code: 'CREATE_SPOT_ERROR' } }
    }

    const enrichedSpot = await enrichSpotWithImages(context, createdSpotResult.data!, imageApplication)
    return { success: true, data: enrichedSpot }
  }

  // Create spot from user CreateSpotRequest (image upload + trail assignment)
  const createSpotFromRequest = async (context: AccountContext, request: CreateSpotRequest): Promise<Result<Spot>> => {
    if (!request.consent) {
      return { success: false, error: { message: 'Consent is required', code: 'CONSENT_REQUIRED' } }
    }

    // Process image upload if provided
    let imageRef: { id: string; url: string } | undefined
    if (request.content.imageBase64) {
      const imageResult = await imageApplication.processAndStore(
        context, 'spot', 'pending', request.content.imageBase64, { blur: true }
      )
      if (!imageResult.success || !imageResult.data) {
        return { success: false, error: { message: 'Image upload failed', code: 'IMAGE_UPLOAD_ERROR' } }
      }
      const urlResult = await imageApplication.refreshImageUrl(context, imageResult.data.blobPath)
      if (urlResult.success && urlResult.data) {
        imageRef = { id: imageResult.data.blobPath, url: urlResult.data }
      }
    }

    const now = new Date()
    const spotResult = await createSpotFromData(context, {
      name: request.content.name,
      description: request.content.description,
      image: imageRef,
      contentBlocks: request.content.contentBlocks,
      location: request.location,
      options: {
        discoveryRadius: 50,
        clueRadius: 500,
        visibility: request.visibility,
      },
      createdBy: context.accountId,
      source: 'created',
      createdAt: now,
      updatedAt: now,
    })

    // Add to trails if requested
    if (spotResult.success && spotResult.data && request.trailIds?.length && trailApplication) {
      for (const trailId of request.trailIds) {
        await trailApplication.addSpotToTrail(context, trailId, spotResult.data.id)
      }
    }

    return spotResult
  }

  return {
    setTrailApplication: (trailApp: TrailApplicationContract) => {
      trailApplication = trailApp
    },

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

    async createSpot(context: AccountContext, spotData: CreateSpotRequest | Omit<Spot, 'id' | 'slug'>): Promise<Result<Spot>> {
      try {
        // Handle CreateSpotRequest (user-created spot with image upload + trail assignment)
        if ('content' in spotData) {
          return await createSpotFromRequest(context, spotData)
        }

        // Handle raw Spot data (internal/admin usage)
        return await createSpotFromData(context, spotData)
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'CREATE_SPOT_ERROR' } }
      }
    },

    async updateSpot(context: AccountContext, spotId: string, updates: UpdateSpotRequest): Promise<Result<Spot>> {
      try {
        // Get spot to verify ownership
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_ERROR' } }
        }
        const spot = spotsResult.data?.find(s => s.id === spotId)
        if (!spot) {
          return { success: false, error: { message: 'Spot not found', code: 'SPOT_NOT_FOUND' } }
        }

        // Verify ownership
        if (spot.createdBy !== context.accountId) {
          return { success: false, error: { message: 'Not authorized to update this spot', code: 'UNAUTHORIZED' } }
        }

        // Process image upload if provided
        let imageBlobPath = spot.imageBlobPath
        let blurredImageBlobPath = spot.blurredImageBlobPath
        if (updates.content?.imageBase64) {
          // Delete old images if they exist
          if (spot.imageBlobPath) {
            await imageApplication.deleteImage(context, spot.imageBlobPath)
          }
          if (spot.blurredImageBlobPath) {
            await imageApplication.deleteImage(context, spot.blurredImageBlobPath)
          }

          // Upload new image
          const imageResult = await imageApplication.processAndStore(
            context, 'spot', 'pending', updates.content.imageBase64, { blur: true }
          )
          if (!imageResult.success || !imageResult.data) {
            return { success: false, error: { message: 'Image upload failed', code: 'IMAGE_UPLOAD_ERROR' } }
          }
          imageBlobPath = imageResult.data.blobPath

          // Generate blurred image path
          const lastDot = imageBlobPath.lastIndexOf('.')
          blurredImageBlobPath = lastDot === -1
            ? `${imageBlobPath}-blurred`
            : `${imageBlobPath.substring(0, lastDot)}-blurred${imageBlobPath.substring(lastDot)}`
        }

        // Update spot entity
        const updatedSpot: StoredSpot = {
          ...spot,
          name: updates.content?.name ?? spot.name,
          description: updates.content?.description ?? spot.description,
          contentBlocks: updates.content?.contentBlocks ?? spot.contentBlocks,
          imageBlobPath,
          blurredImageBlobPath,
          options: {
            ...spot.options,
            visibility: updates.visibility ?? spot.options.visibility,
          },
          updatedAt: new Date(),
        }

        const updateResult = await spotStore.update(spotId, updatedSpot)
        if (!updateResult.success) {
          return { success: false, error: { message: 'Failed to update spot', code: 'UPDATE_SPOT_ERROR' } }
        }

        // Handle trail assignments if provided
        if (updates.trailIds !== undefined && trailApplication) {
          // Get current trail assignments
          const trailsResult = await trailApplication.listTrails(context)
          if (trailsResult.success && trailsResult.data) {
            // Remove spot from all current trails
            for (const trail of trailsResult.data) {
              await trailApplication.removeSpotFromTrail(context, trail.id, spotId)
            }
            // Add spot to new trails
            for (const trailId of updates.trailIds) {
              await trailApplication.addSpotToTrail(context, trailId, spotId)
            }
          }
        }

        const enrichedSpot = await enrichSpotWithImages(context, updatedSpot, imageApplication)
        return { success: true, data: enrichedSpot }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'UPDATE_SPOT_ERROR' } }
      }
    },

    async deleteSpot(context: AccountContext, spotId: string): Promise<Result<void>> {
      try {
        // Get spot to verify ownership
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_ERROR' } }
        }
        const spot = spotsResult.data?.find(s => s.id === spotId)
        if (!spot) {
          return { success: false, error: { message: 'Spot not found', code: 'SPOT_NOT_FOUND' } }
        }

        // Verify ownership
        if (spot.createdBy !== context.accountId) {
          return { success: false, error: { message: 'Not authorized to delete this spot', code: 'UNAUTHORIZED' } }
        }

        // Delete images from blob storage if they exist
        if (spot.imageBlobPath) {
          await imageApplication.deleteImage(context, spot.imageBlobPath)
        }
        if (spot.blurredImageBlobPath) {
          await imageApplication.deleteImage(context, spot.blurredImageBlobPath)
        }

        // Remove spot from all trails
        if (trailApplication) {
          const trailsResult = await trailApplication.listTrails(context)
          if (trailsResult.success && trailsResult.data) {
            for (const trail of trailsResult.data) {
              await trailApplication.removeSpotFromTrail(context, trail.id, spotId)
            }
          }
        }

        // Delete all ratings for this spot
        const ratingsResult = await ratingStore.list()
        if (ratingsResult.success && ratingsResult.data) {
          const spotRatings = ratingsResult.data.filter(r => r.spotId === spotId)
          for (const rating of spotRatings) {
            await ratingStore.delete(rating.id)
          }
        }

        // Delete the spot
        const deleteResult = await spotStore.delete(spotId)
        if (!deleteResult.success) {
          return { success: false, error: { message: 'Failed to delete spot', code: 'DELETE_SPOT_ERROR' } }
        }

        return { success: true, data: undefined }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'DELETE_SPOT_ERROR' } }
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

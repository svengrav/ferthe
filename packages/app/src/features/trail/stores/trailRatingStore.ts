import { createRatingStore } from '@app/shared/stores/createRatingStore'

/**
 * Trail-specific rating store
 * Uses the generic rating store factory
 */
const trailRatingStoreInstance = createRatingStore()

export const trailRatingStore = trailRatingStoreInstance.store
export const useTrailRatingSummary = trailRatingStoreInstance.useRatingSummary
export const getTrailRatingSummary = trailRatingStoreInstance.getRatingSummary
export const getTrailRatingActions = trailRatingStoreInstance.getActions

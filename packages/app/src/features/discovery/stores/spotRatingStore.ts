import { createRatingStore } from '@app/shared/stores/createRatingStore'

/**
 * Spot-specific rating store
 * Uses the generic rating store factory
 */
const spotRatingStoreInstance = createRatingStore()

export const spotRatingStore = spotRatingStoreInstance.store
export const useSpotRatingSummary = spotRatingStoreInstance.useRatingSummary
export const getSpotRatingSummary = spotRatingStoreInstance.getRatingSummary
export const getSpotRatingActions = spotRatingStoreInstance.getActions

import { Status, StoreActions, StoreState } from '@app/shared/stores/types'
import { create, StateCreator } from 'zustand'

export interface RatingSummary {
  average: number
  count: number
  userRating?: number
}

interface RatingStoreActions extends StoreActions {
  setRatingSummary: (entityId: string, summary: RatingSummary) => void
  clearRating: (entityId: string) => void
}

interface RatingStoreState extends StoreState {
  status: Status
  ratings: Record<string, RatingSummary>
}

/**
 * Factory to create a typed rating store for any entity type
 * Reusable pattern for star ratings
 * 
 * @example
 * const useSpotRatings = createRatingStore()
 */
export const createRatingStore = () => {
  const storeCreator: StateCreator<RatingStoreState & RatingStoreActions> = set => ({
    // Metadata
    updatedAt: new Date(0),
    status: 'uninitialized',
    error: undefined,

    ratings: {},

    setStatus: status => set({ status }),
    setRatingSummary: (entityId, summary) =>
      set(state => ({
        ratings: { ...state.ratings, [entityId]: summary },
      })),
    clearRating: entityId =>
      set(state => {
        const { [entityId]: _, ...rest } = state.ratings
        return { ratings: rest }
      }),
  })

  const store = create<RatingStoreState & RatingStoreActions>(storeCreator)

  return {
    // Store instance
    store,

    // Hooks
    useRatingSummary: (entityId: string) => store(state => state.ratings[entityId]),

    // Selectors
    getRatingSummary: (entityId: string) => store.getState().ratings[entityId],

    // Actions
    getActions: () => ({
      setRatingSummary: store.getState().setRatingSummary,
      clearRating: store.getState().clearRating,
      setStatus: store.getState().setStatus,
    }),
  }
}

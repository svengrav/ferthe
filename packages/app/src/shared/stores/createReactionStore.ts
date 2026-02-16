import { Status, StoreActions, StoreState } from '@app/shared/index'
import { create, StateCreator } from 'zustand'

export interface ReactionSummary {
  average: number
  count: number
  userRating?: number
}

interface ReactionStoreActions extends StoreActions {
  setReactionSummary: (entityId: string, summary: ReactionSummary) => void
  clearReaction: (entityId: string) => void
}

interface ReactionStoreState extends StoreState {
  status: Status
  reactions: Record<string, ReactionSummary>
}

/**
 * Factory to create a typed reaction store for any entity type
 * Reusable pattern for like/dislike reactions
 * 
 * @example
 * const useDiscoveryReactions = createReactionStore()
 * const useSportReactions = createReactionStore()
 */
export const createReactionStore = () => {
  const storeCreator: StateCreator<ReactionStoreState & ReactionStoreActions> = set => ({
    // Metadata
    updatedAt: new Date(0),
    status: 'uninitialized',
    error: undefined,

    reactions: {},

    setStatus: status => set({ status }),
    setReactionSummary: (entityId, summary) =>
      set(state => ({
        reactions: { ...state.reactions, [entityId]: summary },
      })),
    clearReaction: entityId =>
      set(state => {
        const { [entityId]: _, ...rest } = state.reactions
        return { reactions: rest }
      }),
  })

  const store = create<ReactionStoreState & ReactionStoreActions>(storeCreator)

  return {
    // Store instance
    store,

    // Hooks
    useReactionSummary: (entityId: string) => store(state => state.reactions[entityId]),

    // Selectors
    getReactionSummary: (entityId: string) => store.getState().reactions[entityId],

    // Actions
    getActions: () => ({
      setReactionSummary: store.getState().setReactionSummary,
      clearReaction: store.getState().clearReaction,
      setStatus: store.getState().setStatus,
    }),
  }
}

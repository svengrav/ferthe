import { StoreActions, StoreData } from '@app/shared/index'
import { create, StateCreator } from 'zustand'

export interface ReactionSummary {
  likes: number
  dislikes: number
  userReaction?: 'like' | 'dislike'
}

interface ReactionStoreActions extends StoreActions {
  setReactionSummary: (entityId: string, summary: ReactionSummary) => void
  clearReaction: (entityId: string) => void
}

interface ReactionStoreData extends StoreData {
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
  const storeCreator: StateCreator<ReactionStoreData & ReactionStoreActions> = set => ({
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

  const store = create<ReactionStoreData & ReactionStoreActions>(storeCreator)

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

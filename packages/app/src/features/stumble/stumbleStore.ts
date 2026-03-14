import { StumbleFeedbackVote, StumblePreference, StumbleSuggestionResult } from '@shared/contracts'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

interface StumbleState {
  isActive: boolean
  isLoading: boolean
  suggestions: StumbleSuggestionResult[]
  selectedPreferences: StumblePreference[]
  visitedPoiIds: Set<string>
  /** User's feedback per POI: poiId → vote */
  feedbackMap: Map<string, StumbleFeedbackVote>
  error: string | undefined
}

interface StumbleActions {
  setActive: (active: boolean) => void
  setLoading: (loading: boolean) => void
  setSuggestions: (suggestions: StumbleSuggestionResult[]) => void
  setSelectedPreferences: (preferences: StumblePreference[]) => void
  markVisited: (poiId: string) => void
  setVisitedPoiIds: (ids: string[]) => void
  setFeedback: (poiId: string, vote: StumbleFeedbackVote) => void
  setError: (error: string | undefined) => void
  reset: () => void
}

const DEFAULT_PREFERENCES: StumblePreference[] = ['historical', 'cafe', 'art']

export const stumbleStore = create<StumbleState & StumbleActions>(set => ({
  isActive: false,
  isLoading: false,
  suggestions: [],
  selectedPreferences: DEFAULT_PREFERENCES,
  visitedPoiIds: new Set(),
  feedbackMap: new Map(),
  error: undefined,

  setActive: isActive => set({ isActive }),
  setLoading: isLoading => set({ isLoading }),
  setSuggestions: suggestions => set({ suggestions }),
  setSelectedPreferences: selectedPreferences => set({ selectedPreferences }),
  markVisited: poiId => set(state => ({ visitedPoiIds: new Set([...state.visitedPoiIds, poiId]) })),
  setVisitedPoiIds: ids => set({ visitedPoiIds: new Set(ids) }),
  setFeedback: (poiId, vote) => set(state => {
    const next = new Map(state.feedbackMap)
    next.set(poiId, vote)
    return { feedbackMap: next }
  }),
  setError: error => set({ error }),
  reset: () => set({ isActive: false, suggestions: [], visitedPoiIds: new Set(), feedbackMap: new Map(), error: undefined, isLoading: false }),
}))

export const useStumbleActive = () => stumbleStore(state => state.isActive)
export const useStumbleLoading = () => stumbleStore(state => state.isLoading)
export const useStumbleSuggestions = () => stumbleStore(useShallow(state => state.suggestions))
export const useStumblePreferences = () => stumbleStore(useShallow(state => state.selectedPreferences))
export const useStumbleVisitedPoiIds = () => stumbleStore(state => state.visitedPoiIds)
export const useStumbleFeedbackMap = () => stumbleStore(state => state.feedbackMap)
export const useStumbleError = () => stumbleStore(state => state.error)

export const getStumbleActions = () => ({
  setActive: stumbleStore.getState().setActive,
  setLoading: stumbleStore.getState().setLoading,
  setSuggestions: stumbleStore.getState().setSuggestions,
  setSelectedPreferences: stumbleStore.getState().setSelectedPreferences,
  markVisited: stumbleStore.getState().markVisited,
  setVisitedPoiIds: stumbleStore.getState().setVisitedPoiIds,
  setFeedback: stumbleStore.getState().setFeedback,
  setError: stumbleStore.getState().setError,
  reset: stumbleStore.getState().reset,
})

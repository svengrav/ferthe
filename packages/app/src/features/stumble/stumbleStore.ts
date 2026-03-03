import { StumblePreference, StumbleSuggestion } from '@shared/contracts'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

interface StumbleState {
  isActive: boolean
  isLoading: boolean
  suggestions: StumbleSuggestion[]
  selectedPreferences: StumblePreference[]
  error: string | undefined
}

interface StumbleActions {
  setActive: (active: boolean) => void
  setLoading: (loading: boolean) => void
  setSuggestions: (suggestions: StumbleSuggestion[]) => void
  setSelectedPreferences: (preferences: StumblePreference[]) => void
  setError: (error: string | undefined) => void
  reset: () => void
}

const DEFAULT_PREFERENCES: StumblePreference[] = ['historical', 'cafe', 'art']

export const stumbleStore = create<StumbleState & StumbleActions>(set => ({
  isActive: false,
  isLoading: false,
  suggestions: [],
  selectedPreferences: DEFAULT_PREFERENCES,
  error: undefined,

  setActive: isActive => set({ isActive }),
  setLoading: isLoading => set({ isLoading }),
  setSuggestions: suggestions => set({ suggestions }),
  setSelectedPreferences: selectedPreferences => set({ selectedPreferences }),
  setError: error => set({ error }),
  reset: () => set({ isActive: false, suggestions: [], error: undefined, isLoading: false }),
}))

export const useStumbleActive = () => stumbleStore(state => state.isActive)
export const useStumbleLoading = () => stumbleStore(state => state.isLoading)
export const useStumbleSuggestions = () => stumbleStore(useShallow(state => state.suggestions))
export const useStumblePreferences = () => stumbleStore(useShallow(state => state.selectedPreferences))
export const useStumbleError = () => stumbleStore(state => state.error)

export const getStumbleActions = () => ({
  setActive: stumbleStore.getState().setActive,
  setLoading: stumbleStore.getState().setLoading,
  setSuggestions: stumbleStore.getState().setSuggestions,
  setSelectedPreferences: stumbleStore.getState().setSelectedPreferences,
  setError: stumbleStore.getState().setError,
  reset: stumbleStore.getState().reset,
})

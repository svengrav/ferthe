import { logger } from '@app/shared/utils/logger'
import { ApiClient } from '@shared/api'
import { getStumbleActions, stumbleStore } from './stumbleStore'

export interface StumbleApplication {
  fetchSuggestions: (lat: number, lon: number, radiusMeters?: number) => Promise<void>
  toggleMode: (lat: number, lon: number) => Promise<void>
  deactivate: () => void
}

interface StumbleApplicationOptions {
  api: ApiClient
}

export function createStumbleApplication(options: StumbleApplicationOptions): StumbleApplication {
  const { api } = options

  const fetchSuggestions = async (lat: number, lon: number, radiusMeters = 800): Promise<void> => {
    const { setLoading, setSuggestions, setError } = getStumbleActions()
    const { selectedPreferences } = stumbleStore.getState()

    setLoading(true)
    setError(undefined)

    logger.log('[Stumble] Fetching suggestions', { lat, lon, radiusMeters, preferences: selectedPreferences })

    const result = await api.stumble.getSuggestions(lat, lon, radiusMeters, selectedPreferences)

    if (result.success && result.data) {
      setSuggestions(result.data)
      logger.log(`[Stumble] ${result.data.length} suggestions loaded`)
    } else {
      setError(result.error?.message ?? 'Failed to load suggestions')
      logger.error('[Stumble] Failed to fetch suggestions', result.error)
    }

    setLoading(false)
  }

  const toggleMode = async (lat: number, lon: number): Promise<void> => {
    const { isActive } = stumbleStore.getState()
    const { setActive, reset } = getStumbleActions()

    if (isActive) {
      reset()
    } else {
      setActive(true)
      await fetchSuggestions(lat, lon)
    }
  }

  const deactivate = (): void => {
    getStumbleActions().reset()
  }

  return { fetchSuggestions, toggleMode, deactivate }
}


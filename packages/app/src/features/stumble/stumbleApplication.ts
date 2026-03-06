import { logger } from '@app/shared/utils/logger'
import { ApiClient } from '@shared/api'
import { getStumbleActions, stumbleStore } from './stumbleStore'

export interface StumbleApplication {
  fetchSuggestions: (lat: number, lon: number, radiusMeters?: number) => Promise<void>
  toggleMode: (lat: number, lon: number) => Promise<void>
  recordVisit: (poiId: string, spotId?: string) => Promise<void>
  syncVisits: () => Promise<void>
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

    const result = await api.stumble.getSuggestions({ lat, lon, radius: radiusMeters, preferences: selectedPreferences.join(',') })

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
      await syncVisits()
      await fetchSuggestions(lat, lon)
    }
  }

  const recordVisit = async (poiId: string, spotId?: string): Promise<void> => {
    const { markVisited } = getStumbleActions()

    // Optimistic UI update
    markVisited(poiId)

    const result = await api.stumble.recordVisit(poiId, spotId)
    if (!result.success) {
      logger.error('[Stumble] Failed to record visit', result.error)
    } else {
      logger.log('[Stumble] Visit recorded', { poiId, spotId })
    }
  }

  const syncVisits = async (): Promise<void> => {
    const { setVisitedPoiIds } = getStumbleActions()

    const result = await api.stumble.getVisits()
    if (result.success && result.data) {
      const poiIds = result.data.map(v => v.poiId)
      setVisitedPoiIds(poiIds)
      logger.log(`[Stumble] Synced ${poiIds.length} visits`)
    }
  }

  const deactivate = (): void => {
    getStumbleActions().reset()
  }

  return { fetchSuggestions, toggleMode, recordVisit, syncVisits, deactivate }
}


import { StumbleFeedback, StumblePoi } from '@shared/contracts/stumble.ts'
import { createStore, Store } from '@core/store/storeFactory.ts'
import { StoreInterface } from '@core/store/storeInterface.ts'
import { STORE_IDS } from '@core/config/index.ts'
import { geoUtils } from '@shared/geo/geoUtils.ts'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@core/shared/logger.ts'

export type StumblePoiStore = Store<StumblePoi>
export type StumbleFeedbackStore = Store<StumbleFeedback>

export function createStumblePoiStore(connector: StoreInterface): StumblePoiStore {
  return createStore<StumblePoi>(connector, STORE_IDS.STUMBLE_POIS)
}

export function createStumbleFeedbackStore(connector: StoreInterface): StumbleFeedbackStore {
  return createStore<StumbleFeedback>(connector, STORE_IDS.STUMBLE_FEEDBACK)
}

// ── POI Repository: geo-queries + dedup-aware upsert ──

export interface StumblePoiRepository {
  findNearby(lat: number, lon: number, radiusMeters: number, limit: number): Promise<StumblePoi[]>
  upsertPoi(poi: StumblePoi): Promise<StumblePoi>
  updateFeedbackScore(poiId: string, delta: number): Promise<void>
}

interface StumblePoiRepositoryOptions {
  poiStore: StumblePoiStore
  supabaseUrl?: string
  supabaseKey?: string
}

export function createStumblePoiRepository(options: StumblePoiRepositoryOptions): StumblePoiRepository {
  const { poiStore, supabaseUrl, supabaseKey } = options
  let supabase: SupabaseClient | undefined

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  const findNearby = async (lat: number, lon: number, radiusMeters: number, limit: number): Promise<StumblePoi[]> => {
    // Use PostGIS RPC when available (production)
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_pois_in_radius', {
          lat, lon, radius_meters: radiusMeters,
        })
        if (error) {
          logger.error('[StumblePoiRepo] RPC get_pois_in_radius failed', { error: error.message })
          return []
        }
        if (!data || data.length === 0) return []

        // RPC returns flat rows — fetch full POIs by IDs
        const ids = (data as { id: string }[]).slice(0, limit).map((r) => r.id)
        const result = await poiStore.list({ filters: { id: ids } })
        return result.success ? (result.data ?? []) : []
      } catch (err) {
        logger.error('[StumblePoiRepo] findNearby RPC error', { error: err instanceof Error ? err.message : String(err) })
        return []
      }
    }

    // Fallback for dev (memory/json store): load all and filter by distance in-memory
    const result = await poiStore.list({ limit: 500 })
    if (!result.success || !result.data) return []

    const origin = { lat, lon }
    return result.data
      .filter(poi => geoUtils.calculateDistance(origin, poi.location) <= radiusMeters)
      .sort((a, b) => geoUtils.calculateDistance(origin, a.location) - geoUtils.calculateDistance(origin, b.location))
      .slice(0, limit)
  }

  const upsertPoi = async (poi: StumblePoi): Promise<StumblePoi> => {
    // Check if POI already exists by externalId
    const existing = await poiStore.list({ filters: { externalId: poi.externalId }, limit: 1 })
    if (existing.success && existing.data && existing.data.length > 0) {
      return existing.data[0]
    }

    const result = await poiStore.create(poi)
    if (!result.success || !result.data) {
      logger.error('[StumblePoiRepo] Failed to create POI', { id: poi.id, message: result.message })
      return poi
    }
    return result.data
  }

  const updateFeedbackScore = async (poiId: string, delta: number): Promise<void> => {
    const result = await poiStore.get(poiId)
    if (!result.success || !result.data) return

    const currentScore = result.data.feedbackScore ?? 0
    await poiStore.update(poiId, { feedbackScore: currentScore + delta } as Partial<StumblePoi>)
  }

  return { findNearby, upsertPoi, updateFeedbackScore }
}

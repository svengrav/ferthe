import { StumblePreference } from '@shared/contracts/stumble.ts'

// ──────────────────────────────────────────────────────────────
// Provider-independent POI type
// ──────────────────────────────────────────────────────────────

export interface Poi {
  id: string
  lat: number
  lon: number
  name?: string
  category: StumblePreference
}

// ──────────────────────────────────────────────────────────────
// Connector interface
// ──────────────────────────────────────────────────────────────

export interface PoiConnector {
  fetchPois(lat: number, lon: number, radiusMeters: number, preferences: StumblePreference[]): Promise<Poi[]>
}

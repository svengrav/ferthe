import { Poi, PoiConnector } from '@core/connectors/poiConnector.ts'
import type { StumblePreference } from '@shared/contracts/index.ts'

export const MOCK_POIS: Record<StumblePreference, Poi[]> = {
  cafe: [
    { id: 'poi-1', lat: 48.1352, lon: 11.5822, name: 'Test Café', category: 'cafe' },
    { id: 'poi-2', lat: 48.1355, lon: 11.5825, name: 'Mock Kaffee', category: 'cafe' },
  ],
  historical: [
    { id: 'poi-3', lat: 48.1360, lon: 11.5830, name: 'Altes Rathaus', category: 'historical' },
  ],
  art: [
    { id: 'poi-4', lat: 48.1358, lon: 11.5828, name: 'Kunstwerk Mitte', category: 'art' },
  ],
  architecture: [
    { id: 'poi-5', lat: 48.1361, lon: 11.5831, name: 'Stadtpalais', category: 'architecture' },
  ],
  nature: [
    { id: 'poi-6', lat: 48.1345, lon: 11.5815, name: 'Stadtpark', category: 'nature' },
    { id: 'poi-7', lat: 48.1342, lon: 11.5812, name: 'Flussufer', category: 'nature' },
  ],
  street_art: [
    { id: 'poi-8', lat: 48.1350, lon: 11.5819, name: 'Mural East', category: 'street_art' },
  ],
}

export const mockPoiConnector: PoiConnector = {
  fetchPois: async (
    _lat: number,
    _lon: number,
    radiusMeters: number,
    preferences: StumblePreference[],
  ): Promise<Poi[]> => {
    // Simulate radius filtering: smaller radius → fewer results
    const multiplier = radiusMeters >= 500 ? 1 : 0
    return preferences.flatMap(pref =>
      (MOCK_POIS[pref] ?? []).slice(0, Math.ceil((MOCK_POIS[pref]?.length ?? 0) * multiplier))
    )
  },
}

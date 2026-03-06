import { StumblePreference } from '@shared/contracts/stumble.ts'

export interface Poi {
  id: string
  lat: number
  lon: number
  name?: string
  category: StumblePreference
  tags?: string[]
  osmId?: string
  address?: string
}

export interface PoiConnector {
  fetchPois(lat: number, lon: number, radiusMeters: number, preferences: StumblePreference[]): Promise<Poi[]>
}

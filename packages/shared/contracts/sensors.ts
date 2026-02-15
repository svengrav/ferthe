import { GeoLocation } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
import { Clue } from './discoveries.ts'
import { Result } from './results.ts'

export interface SensorApplicationContract {
  listScanEvents: (context: AccountContext, trailId: string) => Promise<Result<ScanEvent[]>>
  createScanEvent: (context: AccountContext, location: GeoLocation, trailId?: string) => Promise<Result<ScanEvent>>
}

export interface ScanEvent {
  id: string
  accountId: string
  trailId?: string
  scannedAt: Date
  radiusUsed: number
  successful: boolean
  clues: Clue[]
  createdAt: Date
  location: GeoLocation
  silent?: boolean
}

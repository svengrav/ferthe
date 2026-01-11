import { GeoLocation } from '@shared/geo'
import { AccountContext } from './accounts'
import { Clue } from './discoveries'
import { Result } from './results'

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

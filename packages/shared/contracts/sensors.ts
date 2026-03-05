import type { GeoLocation } from '@shared/geo/index.ts'
import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { ClueSchema } from './discoveries.ts'
import { Result } from './results.ts'
import { guard } from './strings.ts'

/**
 * Scan event schema
 */
export const ScanEventSchema = z.object({
  id: guard.idString,
  accountId: guard.idString,
  trailId: guard.idString.optional(),
  scannedAt: z.date(),
  radiusUsed: guard.positiveInt,
  successful: z.boolean(),
  clues: z.array(ClueSchema),
  createdAt: z.date(),
  location: GeoLocationSchema,
  silent: z.boolean().optional(),
})

export type ScanEvent = z.infer<typeof ScanEventSchema>

export interface SensorApplicationContract {
  listScanEvents: (context: AccountContext, trailId: string) => Promise<Result<ScanEvent[]>>
  createScanEvent: (context: AccountContext, location: GeoLocation, trailId?: string) => Promise<Result<ScanEvent>>
}

import type { GeoLocation } from '@shared/geo/index.ts'
import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { Result } from './results.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Scan event schema
 */
export const ScanEventSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  trailId: z.string().optional(),
  scannedAt: z.date(),
  radiusUsed: z.number(),
  successful: z.boolean(),
  clues: z.array(z.any()), // Clue schema not migrated yet
  createdAt: z.date(),
  location: GeoLocationSchema,
  silent: z.boolean().optional(),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod Schemas)
// ──────────────────────────────────────────────────────────────

export type ScanEvent = z.infer<typeof ScanEventSchema>

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

export interface SensorApplicationContract {
  listScanEvents: (context: AccountContext, trailId: string) => Promise<Result<ScanEvent[]>>
  createScanEvent: (context: AccountContext, location: GeoLocation, trailId?: string) => Promise<Result<ScanEvent>>
}

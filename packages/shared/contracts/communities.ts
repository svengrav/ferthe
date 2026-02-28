import { z } from 'zod'
import { AccountContext, AccountPublicProfileSchema } from './accounts.ts'
import { Discovery } from './discoveries.ts'
import { Result } from './results.ts'
import { guard } from './strings.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Community schema
 */
export const CommunitySchema = z.object({
  id: guard.idString,
  name: guard.shortText,
  trailIds: z.array(guard.idString).max(10),
  createdBy: guard.idString,
  inviteCode: guard.inviteCode,
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Community member schema
 */
export const CommunityMemberSchema = z.object({
  id: guard.idString,
  communityId: guard.idString,
  accountId: guard.idString,
  joinedAt: z.date(),
  profile: AccountPublicProfileSchema.optional()

})

/**
 * Shared discovery schema
 */
export const SharedDiscoverySchema = z.object({
  id: guard.idString,
  discoveryId: guard.idString,
  communityId: guard.idString,
  sharedBy: guard.idString,
  sharedAt: z.date(),
})

/**
 * Community discovery stats schema
 */
export const CommunityDiscoveryStatsSchema = z.object({
  discoveryId: guard.idString,
  communityId: guard.idString,
  discoveredBy: guard.idString,
  rank: z.number().int().positive(),
  totalDiscoverers: z.number().int().positive(),
  averageRating: z.number().min(0).max(5),
  ratingCount: z.number().int().min(0),
})

/**
 * Validation schema for creating a community
 */
export const createCommunitySchema = z.object({
  name: guard.shortText.min(3, 'Name must be at least 3 characters'),
  trailId: z.string().min(1, 'Trail selection is required'),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod Schemas)
// ──────────────────────────────────────────────────────────────

export type Community = z.infer<typeof CommunitySchema>
export type CommunityMember = z.infer<typeof CommunityMemberSchema>
export type SharedDiscovery = z.infer<typeof SharedDiscoverySchema>
export type CommunityDiscoveryStats = z.infer<typeof CommunityDiscoveryStatsSchema>
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

/**
 * Application contract for managing communities.
 * Communities allow users to share discoveries and form groups.
 */
export interface CommunityApplicationContract {
  createCommunity: (context: AccountContext, options: { name: string; trailIds: string[] }) => Promise<Result<Community>>
  joinCommunity: (context: AccountContext, inviteCode: string) => Promise<Result<Community>>
  leaveCommunity: (context: AccountContext, communityId: string) => Promise<Result<void>>
  updateCommunity: (context: AccountContext, communityId: string, input: { name: string; trailIds: string[] }) => Promise<Result<Community>>
  removeCommunity: (context: AccountContext, communityId: string) => Promise<Result<void>>
  getCommunity: (context: AccountContext, communityId: string) => Promise<Result<Community | undefined>>
  listCommunities: (context: AccountContext) => Promise<Result<Community[]>>
  listCommunityMembers: (context: AccountContext, communityId: string) => Promise<Result<CommunityMember[]>>
  shareDiscovery: (context: AccountContext, discoveryId: string, communityId: string) => Promise<Result<SharedDiscovery>>
  unshareDiscovery: (context: AccountContext, discoveryId: string, communityId: string) => Promise<Result<void>>
  getSharedDiscoveries: (context: AccountContext, communityId: string) => Promise<Result<Discovery[]>>
}
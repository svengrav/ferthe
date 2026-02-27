import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { Discovery } from './discoveries.ts'
import { Result } from './results.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Community schema
 */
export const CommunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  trailIds: z.array(z.string()),
  createdBy: z.string(),
  inviteCode: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Community member schema
 */
export const CommunityMemberSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  accountId: z.string(),
  joinedAt: z.date(),
})

/**
 * Community member with profile schema
 */
export const CommunityMemberWithProfileSchema = CommunityMemberSchema.extend({
  profile: z.any(), // AccountPublicProfile - already migrated
})

/**
 * Shared discovery schema
 */
export const SharedDiscoverySchema = z.object({
  id: z.string(),
  discoveryId: z.string(),
  communityId: z.string(),
  sharedBy: z.string(),
  sharedAt: z.date(),
})

/**
 * Community discovery stats schema
 */
export const CommunityDiscoveryStatsSchema = z.object({
  discoveryId: z.string(),
  communityId: z.string(),
  discoveredBy: z.string(),
  rank: z.number().int(),
  totalDiscoverers: z.number().int(),
  averageRating: z.number(),
  ratingCount: z.number().int(),
})

/**
 * Validation schema for creating a community
 */
export const createCommunitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be at most 50 characters'),
  trailId: z.string().min(1, 'Trail selection is required'),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod Schemas)
// ──────────────────────────────────────────────────────────────

export type Community = z.infer<typeof CommunitySchema>
export type CommunityMember = z.infer<typeof CommunityMemberSchema>
export type CommunityMemberWithProfile = z.infer<typeof CommunityMemberWithProfileSchema>
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
  listCommunityMembers: (context: AccountContext, communityId: string) => Promise<Result<CommunityMemberWithProfile[]>>
  shareDiscovery: (context: AccountContext, discoveryId: string, communityId: string) => Promise<Result<SharedDiscovery>>
  unshareDiscovery: (context: AccountContext, discoveryId: string, communityId: string) => Promise<Result<void>>
  getSharedDiscoveries: (context: AccountContext, communityId: string) => Promise<Result<Discovery[]>>
}
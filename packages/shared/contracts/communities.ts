import { z } from 'zod';
import { AccountContext } from './accounts.ts';
import { Discovery } from './discoveries.ts';
import { Result } from './results.ts';

/**
 * Application contract for managing communities.
 * Communities allow users to share discoveries and form groups.
 */
export interface CommunityApplicationContract {
  createCommunity: (context: AccountContext, options: { name: string; trailIds: string[] }) => Promise<Result<Community>>
  joinCommunity: (context: AccountContext, inviteCode: string) => Promise<Result<Community>>
  leaveCommunity: (context: AccountContext, communityId: string) => Promise<Result<void>>
  getCommunity: (context: AccountContext, communityId: string) => Promise<Result<Community | undefined>>
  listCommunities: (context: AccountContext) => Promise<Result<Community[]>>
  listCommunityMembers: (context: AccountContext, communityId: string) => Promise<Result<CommunityMember[]>>
  shareDiscovery: (context: AccountContext, discoveryId: string, communityId: string) => Promise<Result<SharedDiscovery>>
  unshareDiscovery: (context: AccountContext, discoveryId: string, communityId: string) => Promise<Result<void>>
  getSharedDiscoveries: (context: AccountContext, communityId: string) => Promise<Result<Discovery[]>>
}

/**
 * Represents a community in the application.
 * A community is a group of users who share discoveries.
 */
export interface Community {
  id: string
  name: string
  trailIds: string[] // Trails that belong to this community (initially max 1)
  createdBy: string
  inviteCode: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Represents a member of a community.
 */
export interface CommunityMember {
  id: string // Composite key: communityId-accountId
  communityId: string
  accountId: string
  joinedAt: Date
}

/**
 * Represents a discovery shared within a community.
 * Separates private discoveries from community-shared ones.
 */
export interface SharedDiscovery {
  id: string // Composite key: communityId-discoveryId
  discoveryId: string
  communityId: string
  sharedBy: string // accountId who shared it
  sharedAt: Date
}

/**
 * Statistics for a discovery within a community context.
 */
export interface CommunityDiscoveryStats {
  discoveryId: string
  communityId: string
  discoveredBy: string // accountId
  rank: number // Which user number discovered this spot in the community
  totalDiscoverers: number // Total number of community members who discovered this
  likes: number
  dislikes: number
}

/**
 * Validation schema for creating a community.
 */
export const createCommunitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be at most 50 characters'),
  trailId: z.string().min(1, 'Trail selection is required'),
})

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>
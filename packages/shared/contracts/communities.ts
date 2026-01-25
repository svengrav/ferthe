import { AccountContext } from './accounts.ts'
import { Result } from './results.ts'

/**
 * Application contract for managing communities.
 * Communities allow users to share discoveries and form groups.
 */
export interface CommunityApplicationContract {
  createCommunity: (context: AccountContext, name: string) => Promise<Result<Community>>
  joinCommunity: (context: AccountContext, inviteCode: string) => Promise<Result<Community>>
  leaveCommunity: (context: AccountContext, communityId: string) => Promise<Result<void>>
  getCommunity: (context: AccountContext, communityId: string) => Promise<Result<Community | undefined>>
  listCommunities: (context: AccountContext) => Promise<Result<Community[]>>
  listCommunityMembers: (context: AccountContext, communityId: string) => Promise<Result<CommunityMember[]>>
}

/**
 * Represents a community in the application.
 * A community is a group of users who share discoveries.
 */
export interface Community {
  id: string
  name: string
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
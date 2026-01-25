import { Community, CommunityDiscoveryStats, CommunityMember, Discovery, DiscoveryReaction } from '@shared/contracts'

/**
 * Type definition for the Community Service functionality.
 * All functions are pure and side-effect free.
 */
export type CommunityServiceActions = {
  isMember: (accountId: string, members: CommunityMember[]) => boolean
  getMemberCommunities: (accountId: string, members: CommunityMember[], communities: Community[]) => Community[]
  getSharedDiscoveries: (communityId: string, discoveries: Discovery[]) => Discovery[]
  getCommunityDiscoveryStats: (discoveryId: string, communityId: string, discoveries: Discovery[], reactions: DiscoveryReaction[]) => CommunityDiscoveryStats
  generateInviteCode: () => string
  createCommunity: (accountId: string, name: string, inviteCode: string) => Community
  createMember: (communityId: string, accountId: string) => CommunityMember
}

/**
 * Checks if an account is a member of a community.
 */
const isMember = (accountId: string, members: CommunityMember[]): boolean => {
  return members.some(m => m.accountId === accountId)
}

/**
 * Gets all communities for a specific account.
 */
const getMemberCommunities = (accountId: string, members: CommunityMember[], communities: Community[]): Community[] => {
  const communityIds = members.filter(m => m.accountId === accountId).map(m => m.communityId)
  return communities.filter(c => communityIds.includes(c.id))
}

/**
 * Gets all discoveries shared within a community.
 */
const getSharedDiscoveries = (communityId: string, discoveries: Discovery[]): Discovery[] => {
  return discoveries.filter(d => d.communityId === communityId)
}

/**
 * Gets statistics for a discovery within a community context.
 */
const getCommunityDiscoveryStats = (
  discoveryId: string,
  communityId: string,
  discoveries: Discovery[],
  reactions: DiscoveryReaction[]
): CommunityDiscoveryStats => {
  const discovery = discoveries.find(d => d.id === discoveryId)
  if (!discovery) {
    throw new Error(`Discovery ${discoveryId} not found`)
  }

  // Get all discoveries for this spot in this community
  const spotDiscoveries = discoveries.filter(d => d.spotId === discovery.spotId && d.communityId === communityId)

  // Sort by discovered date to determine rank
  const sortedDiscoveries = [...spotDiscoveries].sort((a, b) => a.discoveredAt.getTime() - b.discoveredAt.getTime())
  const rank = sortedDiscoveries.findIndex(d => d.id === discoveryId) + 1
  const totalDiscoverers = spotDiscoveries.length

  // Count reactions
  const discoveryReactions = reactions.filter(r => r.discoveryId === discoveryId)
  const likes = discoveryReactions.filter(r => r.reaction === 'like').length
  const dislikes = discoveryReactions.filter(r => r.reaction === 'dislike').length

  return {
    discoveryId,
    communityId,
    discoveredBy: discovery.accountId,
    rank,
    totalDiscoverers,
    likes,
    dislikes,
  }
}

/**
 * Generates a random 6-character invite code.
 */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Creates a new community object.
 */
const createCommunity = (accountId: string, name: string, inviteCode: string): Community => {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    name,
    createdBy: accountId,
    inviteCode,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Creates a new community member object.
 */
const createMember = (communityId: string, accountId: string): CommunityMember => {
  return {
    id: `${communityId}-${accountId}`,
    communityId,
    accountId,
    joinedAt: new Date(),
  }
}

/**
 * Community service with pure functions for community logic.
 */
export const communityService: CommunityServiceActions = {
  isMember,
  getMemberCommunities,
  getSharedDiscoveries,
  getCommunityDiscoveryStats,
  generateInviteCode,
  createCommunity,
  createMember,
}

export function createCommunityService(): CommunityServiceActions {
  return communityService
}

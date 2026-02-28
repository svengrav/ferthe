import { Store } from '@core/store/storeFactory.ts'
import { AccountContext, AccountProfileCompositeContract, Community, CommunityApplicationContract, CommunityMember, createErrorResult, createSuccessResult, Discovery, Result, SharedDiscovery, StoredTrailSpot } from '@shared/contracts'
import { CommunityServiceActions, createCommunityService } from './communityService.ts'
import { CommunityStore } from './communityStore.ts'

export interface CommunityApplicationOptions {
  communityStore: CommunityStore
  discoveryStore: Store<Discovery>
  trailSpotStore: Store<StoredTrailSpot>
  accountProfileComposite: AccountProfileCompositeContract
  communityService?: CommunityServiceActions
}

/**
 * Creates a community application that handles all community-related operations.
 */
export function createCommunityApplication(options: CommunityApplicationOptions): CommunityApplicationContract {
  const { communityStore, discoveryStore, trailSpotStore, accountProfileComposite, communityService = createCommunityService() } = options

  const createCommunity = async (context: AccountContext, options: { name: string; trailIds: string[] }): Promise<Result<Community>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const { name, trailIds } = options

      // Validate trail IDs limit (max 1 initially)
      if (trailIds.length === 0) {
        return createErrorResult('TRAIL_REQUIRED')
      }
      if (trailIds.length > 1) {
        return createErrorResult('TOO_MANY_TRAILS')
      }

      // Verify trails exist by checking if they have any trail-spot relations
      const trailSpotsResult = await trailSpotStore.list()
      if (!trailSpotsResult.success) {
        return createErrorResult('CREATE_COMMUNITY_ERROR')
      }

      const existingTrailIds = new Set(
        (trailSpotsResult.data || []).map(ts => ts.trailId)
      )

      const invalidTrails = trailIds.filter(trailId => !existingTrailIds.has(trailId))
      if (invalidTrails.length > 0) {
        return createErrorResult('TRAIL_NOT_FOUND')
      }

      // Generate unique invite code
      const inviteCode = communityService.generateInviteCode()

      // Create community
      const community = communityService.createCommunity(accountId, name, trailIds, inviteCode)
      const createResult = await communityStore.communities.create(community)

      if (!createResult.success) {
        return createErrorResult('CREATE_COMMUNITY_ERROR')
      }

      // Add creator as first member
      const member = communityService.createMember(community.id, accountId)
      await communityStore.members.create(member)

      return createSuccessResult(createResult.data!)
    } catch (error: unknown) {
      return createErrorResult('CREATE_COMMUNITY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const joinCommunity = async (context: AccountContext, inviteCode: string): Promise<Result<Community>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Find community by invite code
      const communitiesResult = await communityStore.communities.list()
      if (!communitiesResult.success) {
        return createErrorResult('GET_COMMUNITIES_ERROR')
      }

      const community = communitiesResult.data?.find(c => c.inviteCode === inviteCode)
      if (!community) {
        return createErrorResult('COMMUNITY_NOT_FOUND')
      }

      // Check if already a member
      const membersResult = await communityStore.members.list()
      if (!membersResult.success) {
        return createErrorResult('GET_MEMBERS_ERROR')
      }

      const communityMembers = membersResult.data?.filter(m => m.communityId === community.id) || []
      if (communityService.isMember(accountId, communityMembers)) {
        return createErrorResult('ALREADY_MEMBER')
      }

      // Add as member
      const member = communityService.createMember(community.id, accountId)
      await communityStore.members.create(member)

      return createSuccessResult(community)
    } catch (error: unknown) {
      return createErrorResult('JOIN_COMMUNITY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const leaveCommunity = async (context: AccountContext, communityId: string): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Find and delete membership
      const membersResult = await communityStore.members.list()
      if (!membersResult.success) {
        return createErrorResult('GET_MEMBERS_ERROR')
      }

      const membership = membersResult.data?.find(m => m.communityId === communityId && m.accountId === accountId)
      if (!membership) {
        return createErrorResult('NOT_A_MEMBER')
      }

      // Delete all shared discoveries by this user in this community
      const sharedResult = await communityStore.discoveries.list()
      if (sharedResult.success && sharedResult.data) {
        const userSharedDiscoveries = sharedResult.data.filter(
          sd => sd.communityId === communityId && sd.sharedBy === accountId
        )
        await Promise.all(
          userSharedDiscoveries.map(sd => communityStore.discoveries.delete(sd.id))
        )
      }

      // Delete membership
      const deleteResult = await communityStore.members.delete(`${communityId}-${accountId}`)
      if (!deleteResult.success) {
        return createErrorResult('LEAVE_COMMUNITY_ERROR')
      }

      return createSuccessResult(undefined)
    } catch (error: unknown) {
      return createErrorResult('LEAVE_COMMUNITY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  const updateCommunity = async (context: AccountContext, communityId: string, input: { name: string; trailIds: string[] }): Promise<Result<Community>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      const communityResult = await communityStore.communities.get(communityId)
      if (!communityResult.success || !communityResult.data) {
        return createErrorResult('COMMUNITY_NOT_FOUND')
      }

      if (communityResult.data.createdBy !== accountId) {
        return createErrorResult('NOT_CREATOR')
      }

      const updated = await communityStore.communities.update(communityId, {
        name: input.name,
        trailIds: input.trailIds,
        updatedAt: new Date(),
      })

      if (!updated.success || !updated.data) {
        return createErrorResult('UPDATE_COMMUNITY_ERROR')
      }

      return createSuccessResult(updated.data)
    } catch (error: unknown) {
      return createErrorResult('UPDATE_COMMUNITY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  const getCommunity = async (_context: AccountContext, communityId: string): Promise<Result<Community | undefined>> => {
    try {
      const result = await communityStore.communities.get(communityId)
      if (!result.success) {
        return createErrorResult('GET_COMMUNITY_ERROR')
      }

      return createSuccessResult(result.data)
    } catch (error: unknown) {
      return createErrorResult('GET_COMMUNITY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const listCommunities = async (context: AccountContext): Promise<Result<Community[]>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get all communities and members
      const [communitiesResult, membersResult] = await Promise.all([
        communityStore.communities.list(),
        communityStore.members.list(),
      ])

      if (!communitiesResult.success || !membersResult.success) {
        return createErrorResult('GET_COMMUNITIES_ERROR')
      }

      // Filter to user's communities
      const communities = communityService.getMemberCommunities(
        accountId,
        membersResult.data || [],
        communitiesResult.data || []
      )

      return createSuccessResult(communities)
    } catch (error: unknown) {
      return createErrorResult('GET_COMMUNITIES_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const listCommunityMembers = async (context: AccountContext, communityId: string): Promise<Result<CommunityMember[]>> => {
    try {
      const membersResult = await communityStore.members.list()
      if (!membersResult.success) {
        return createErrorResult('GET_MEMBERS_ERROR')
      }

      const members = membersResult.data?.filter(m => m.communityId === communityId) || []

      // Get public profiles for all members
      const accountIds = members.map(m => m.accountId)
      if (accountIds.length === 0) {
        return createSuccessResult([])
      }

      const profilesResult = await accountProfileComposite.getPublicProfiles(context, accountIds)
      if (!profilesResult.success) {
        return createErrorResult('GET_PROFILES_ERROR')
      }

      // Enrich members with profiles
      const profileMap = new Map(profilesResult.data!.map(p => [p.accountId, p]))
      const enrichedMembers: CommunityMember[] = members.map(member => ({
        ...member,
        profile: profileMap.get(member.accountId)!,
      }))

      return createSuccessResult(enrichedMembers)
    } catch (error: unknown) {
      return createErrorResult('GET_MEMBERS_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const shareDiscovery = async (context: AccountContext, discoveryId: string, communityId: string): Promise<Result<SharedDiscovery>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get discovery
      const discoveryResult = await discoveryStore.get(discoveryId)
      if (!discoveryResult.success || !discoveryResult.data) {
        return createErrorResult('DISCOVERY_NOT_FOUND')
      }
      const discovery = discoveryResult.data

      // Verify ownership
      if (discovery.accountId !== accountId) {
        return createErrorResult('UNAUTHORIZED')
      }

      // Get community
      const communityResult = await communityStore.communities.get(communityId)
      if (!communityResult.success || !communityResult.data) {
        return createErrorResult('COMMUNITY_NOT_FOUND')
      }
      const community = communityResult.data

      // Verify user is member
      const membersResult = await communityStore.members.list()
      if (!membersResult.success) {
        return createErrorResult('GET_MEMBERS_ERROR')
      }
      const communityMembers = membersResult.data?.filter(m => m.communityId === communityId) || []
      if (!communityService.isMember(accountId, communityMembers)) {
        return createErrorResult('NOT_A_MEMBER')
      }

      // Verify discovery spot is in one of the community trails
      const trailSpotsResult = await trailSpotStore.list()
      if (!trailSpotsResult.success) {
        return createErrorResult('SHARE_DISCOVERY_ERROR')
      }

      const isSpotInCommunityTrail = (trailSpotsResult.data || []).some(
        ts => community.trailIds.includes(ts.trailId) && ts.spotId === discovery.spotId
      )

      if (!isSpotInCommunityTrail) {
        return createErrorResult('DISCOVERY_SPOT_NOT_IN_COMMUNITY_TRAILS')
      }

      // Verify discovery is not older than 24 hours
      const now = new Date()
      const discoveryAge = now.getTime() - new Date(discovery.discoveredAt).getTime()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      if (discoveryAge > maxAge) {
        return createErrorResult('DISCOVERY_TOO_OLD')
      }

      // Check if already shared
      const existingShareResult = await communityStore.discoveries.get(`${communityId}-${discoveryId}`)
      if (existingShareResult.success && existingShareResult.data) {
        return createErrorResult('ALREADY_SHARED')
      }

      // Create shared discovery
      const sharedDiscovery = communityService.createSharedDiscovery(discoveryId, communityId, accountId)
      const createResult = await communityStore.discoveries.create(sharedDiscovery)

      if (!createResult.success) {
        return createErrorResult('SHARE_DISCOVERY_ERROR')
      }

      return createSuccessResult(createResult.data!)
    } catch (error: unknown) {
      return createErrorResult('SHARE_DISCOVERY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const unshareDiscovery = async (context: AccountContext, discoveryId: string, communityId: string): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get shared discovery
      const sharedId = `${communityId}-${discoveryId}`
      const sharedResult = await communityStore.discoveries.get(sharedId)
      if (!sharedResult.success || !sharedResult.data) {
        return createErrorResult('SHARED_DISCOVERY_NOT_FOUND')
      }

      // Verify ownership
      if (sharedResult.data.sharedBy !== accountId) {
        return createErrorResult('UNAUTHORIZED')
      }

      // Delete shared discovery
      const deleteResult = await communityStore.discoveries.delete(sharedId)
      if (!deleteResult.success) {
        return createErrorResult('UNSHARE_DISCOVERY_ERROR')
      }

      return createSuccessResult(undefined)
    } catch (error: unknown) {
      return createErrorResult('UNSHARE_DISCOVERY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const getSharedDiscoveries = async (context: AccountContext, communityId: string): Promise<Result<Discovery[]>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Verify user is member
      const membersResult = await communityStore.members.list()
      if (!membersResult.success) {
        return createErrorResult('GET_MEMBERS_ERROR')
      }
      const communityMembers = membersResult.data?.filter(m => m.communityId === communityId) || []
      if (!communityService.isMember(accountId, communityMembers)) {
        return createErrorResult('NOT_A_MEMBER')
      }

      // Get all shared discoveries for this community
      const sharedResult = await communityStore.discoveries.list()
      if (!sharedResult.success) {
        return createErrorResult('GET_SHARED_DISCOVERIES_ERROR')
      }

      const sharedDiscoveryIds = (sharedResult.data || [])
        .filter(sd => sd.communityId === communityId)
        .map(sd => sd.discoveryId)

      // Get all discoveries
      const discoveriesResult = await discoveryStore.list()
      if (!discoveriesResult.success) {
        return createErrorResult('GET_DISCOVERIES_ERROR')
      }

      // Filter to shared ones
      const discoveries = (discoveriesResult.data || [])
        .filter(d => sharedDiscoveryIds.includes(d.id))

      return createSuccessResult(discoveries)
    } catch (error: unknown) {
      return createErrorResult('GET_SHARED_DISCOVERIES_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const removeCommunity = async (context: AccountContext, communityId: string): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Get community and verify user is the creator
      const communityResult = await communityStore.communities.get(communityId)
      if (!communityResult.success) {
        return createErrorResult('GET_COMMUNITY_ERROR')
      }

      const community = communityResult.data
      if (!community) {
        return createErrorResult('COMMUNITY_NOT_FOUND')
      }

      if (community.createdBy !== accountId) {
        return createErrorResult('NOT_CREATOR')
      }

      // Delete all members
      const membersResult = await communityStore.members.list()
      if (membersResult.success && membersResult.data) {
        const communityMembers = membersResult.data.filter(m => m.communityId === communityId)
        await Promise.all(
          communityMembers.map(m => communityStore.members.delete(m.id))
        )
      }

      // Delete all shared discoveries
      const sharedResult = await communityStore.discoveries.list()
      if (sharedResult.success && sharedResult.data) {
        const communityDiscoveries = sharedResult.data.filter(sd => sd.communityId === communityId)
        await Promise.all(
          communityDiscoveries.map(sd => communityStore.discoveries.delete(sd.id))
        )
      }

      // Delete the community
      const deleteResult = await communityStore.communities.delete(communityId)
      if (!deleteResult.success) {
        return createErrorResult('REMOVE_COMMUNITY_ERROR')
      }

      return createSuccessResult(undefined)
    } catch (error: unknown) {
      return createErrorResult('REMOVE_COMMUNITY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return {
    createCommunity,
    updateCommunity,
    joinCommunity,
    leaveCommunity,
    removeCommunity,
    getCommunity,
    listCommunities,
    listCommunityMembers,
    shareDiscovery,
    unshareDiscovery,
    getSharedDiscoveries,
  }
}

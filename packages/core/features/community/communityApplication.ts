import { AccountContext, Community, CommunityApplicationContract, CommunityMember, createErrorResult, createSuccessResult, Result } from '@shared/contracts'
import { CommunityServiceActions, createCommunityService } from './communityService.ts'
import { CommunityStore } from './communityStore.ts'

export interface CommunityApplicationOptions {
  communityStore: CommunityStore
  communityService?: CommunityServiceActions
}

/**
 * Creates a community application that handles all community-related operations.
 */
export function createCommunityApplication(options: CommunityApplicationOptions): CommunityApplicationContract {
  const { communityStore, communityService = createCommunityService() } = options

  const createCommunity = async (context: AccountContext, name: string): Promise<Result<Community>> => {
    try {
      const accountId = context.accountId
      if (!accountId) {
        return createErrorResult('ACCOUNT_ID_REQUIRED')
      }

      // Generate unique invite code
      const inviteCode = communityService.generateInviteCode()

      // Create community
      const community = communityService.createCommunity(accountId, name, inviteCode)
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

      const deleteResult = await communityStore.members.delete(`${communityId}_${accountId}`)
      if (!deleteResult.success) {
        return createErrorResult('LEAVE_COMMUNITY_ERROR')
      }

      return createSuccessResult(undefined)
    } catch (error: unknown) {
      return createErrorResult('LEAVE_COMMUNITY_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
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

  const listCommunityMembers = async (_context: AccountContext, communityId: string): Promise<Result<CommunityMember[]>> => {
    try {
      const membersResult = await communityStore.members.list()
      if (!membersResult.success) {
        return createErrorResult('GET_MEMBERS_ERROR')
      }

      const members = membersResult.data?.filter(m => m.communityId === communityId) || []
      return createSuccessResult(members)
    } catch (error: unknown) {
      return createErrorResult('GET_MEMBERS_ERROR', { originalError: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return {
    createCommunity,
    joinCommunity,
    leaveCommunity,
    getCommunity,
    listCommunities,
    listCommunityMembers,
  }
}

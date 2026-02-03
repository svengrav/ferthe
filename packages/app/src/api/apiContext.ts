import {
  Account,
  AccountContext,
  AccountSession,
  AccountUpdateData,
  ApplicationContract,
  Clue,
  Community,
  CommunityMember,
  Discovery,
  DiscoveryContent,
  DiscoveryLocationRecord,
  DiscoveryProfile,
  DiscoveryProfileUpdateData,
  DiscoveryReaction,
  DiscoverySpot,
  DiscoveryStats,
  DiscoveryTrail,
  FirebaseConfig,
  LocationWithDirection,
  ReactionSummary,
  ScanEvent,
  SessionValidationResult,
  SharedDiscovery,
  SMSCodeRequest,
  SMSVerificationResult,
  Spot,
  SpotPreview,
  Trail,
  TrailSpot
} from '@shared/contracts'
import { APIError, createAPIClient } from './client'
import { checkStatus, StatusResult } from './utils'


export interface ApiContextOptions {
  apiEndpoint: string
  environment?: 'production' | 'development' | 'test'
  getAccountSession: () => AccountSession | null
  timeout?: number
  onConnectionError?: (error: APIError) => void
}

interface CoreConfiguration {
  environment?: 'production' | 'development' | 'test'
}

export type APIContext = Omit<ApplicationContract, 'spotApplication'> & {
  readonly config: CoreConfiguration
  system: {
    checkStatus: () => Promise<StatusResult>
  }
}

// Main API Context Factory
export const createApiContext = (options: ApiContextOptions): APIContext => {
  const { apiEndpoint, environment = 'production', getAccountSession, timeout = 10000 } = options
  const API = createAPIClient(apiEndpoint, getAccountSession, timeout)


  return {
    config: { environment },
    system: {
      checkStatus: () => checkStatus(`${apiEndpoint}/status`),
    },

    /**
     * Discovery Application API Methods
     * These methods handle discovery processing, retrieval of discoveries, and related data.
     * They are designed to be used in the context of discovery management and user interactions.
     * They require an account context to access user-specific data.
     */
    discoveryApplication: {
      processLocation: (_context: AccountContext, locationWithDirection: LocationWithDirection, trailId: string) =>
        API.send<DiscoveryLocationRecord>('/discoveries/process', 'POST', { locationWithDirection, trailId }),

      getDiscoveries: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<Discovery[]>(`/discovery/collections/discoveries${params}`)
      },

      getDiscovery: (_context: AccountContext, discoveryId: string) => API.send<Discovery>(`/discovery/collections/discoveries/${discoveryId}`),

      getDiscoveredSpots: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<DiscoverySpot[]>(`/discovery/collections/spots${params}`)
      },

      getDiscoveredSpotIds: async (_context: AccountContext, trailId?: string) => {
        const discoveries = await API.send<Discovery[]>(`/discovery/collections/discoveries${trailId ? `?trailId=${trailId}` : ''}`)
        return { data: discoveries.data?.map(d => d.spotId) || [] }
      },

      getDiscoveredPreviewClues: (_context: AccountContext, trailId: string) => API.send<Clue[]>(`/discovery/collections/trails/${trailId}/clues`),

      getDiscoveryTrail: (_context: AccountContext, trailId: string) => API.send<DiscoveryTrail>(`/discovery/collections/trails/${trailId}`),

      // Profile methods
      getDiscoveryProfile: (_context: AccountContext) => API.send<DiscoveryProfile>('/discovery/profile'),

      updateDiscoveryProfile: (_context: AccountContext, updateData: DiscoveryProfileUpdateData) => API.send<DiscoveryProfile>('/discovery/profile', 'PUT', updateData),

      getDiscoveryStats: (_context: AccountContext, discoveryId: string) => API.send<DiscoveryStats>(`/discoveries/${discoveryId}/stats`),

      // Content methods
      getDiscoveryContent: (_context: AccountContext, discoveryId: string) => API.send<DiscoveryContent | undefined>(`/discoveries/${discoveryId}/content`),

      addDiscoveryContent: (_context: AccountContext, discoveryId: string, content: { imageUrl?: string; comment?: string }) =>
        API.send<DiscoveryContent>(`/discoveries/${discoveryId}/content`, 'POST', content),

      updateDiscoveryContent: (_context: AccountContext, discoveryId: string, content: { imageUrl?: string; comment?: string }) =>
        API.send<DiscoveryContent>(`/discoveries/${discoveryId}/content`, 'PUT', content),

      deleteDiscoveryContent: (_context: AccountContext, discoveryId: string) =>
        API.send<void>(`/discoveries/${discoveryId}/content`, 'DELETE'),

      // Reaction methods
      reactToDiscovery: (_context: AccountContext, discoveryId: string, reaction: 'like' | 'dislike') =>
        API.send<DiscoveryReaction>(`/discoveries/${discoveryId}/reactions`, 'POST', { reaction }),

      removeReaction: (_context: AccountContext, discoveryId: string) =>
        API.send<void>(`/discoveries/${discoveryId}/reactions`, 'DELETE'),

      getReactionSummary: (_context: AccountContext, discoveryId: string) =>
        API.send<ReactionSummary>(`/discoveries/${discoveryId}/reactions`),
    },

    /**
     * Trail Application API Methods
     * These methods handle trail and spot management.
     * They are designed to be used in the context of trail and spot data management.
     */
    trailApplication: {
      listTrails: (_context: AccountContext) => API.send<Trail[]>('/trail/collections/trails'),

      getTrail: (_context: AccountContext, id: string) => API.send<Trail | undefined>(`/trail/collections/trails/${id}`),

      createTrail: (_context: AccountContext, trail: any) => API.send<Trail>('/trail/collections/trails', 'POST', trail),

      listSpots: (_context: AccountContext) => API.send<Spot[]>('/trail/collections/spots'),

      getSpot: (_context: AccountContext, id: string) => API.send<Spot | undefined>(`/trail/collections/spots/${id}`),

      listSpotPreviews: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<SpotPreview[]>(`/trail/collections/spot-previews${params}`)
      },

      getTrailSpotIds: (_context: AccountContext, trailId: string) => API.send<string[]>(`/trail/collections/trails/${trailId}/spots`),

      createSpot: (_context: AccountContext, spot: any) => API.send<Spot>('/trail/collections/spots', 'POST', spot),

      addSpotToTrail: (_context: AccountContext, trailId: string, spotId: string, order?: number) =>
        API.send<TrailSpot>(`/trail/${trailId}/spots/${spotId}`, 'POST', { order }),

      removeSpotFromTrail: (_context: AccountContext, trailId: string, spotId: string) =>
        API.send<void>(`/trail/${trailId}/spots/${spotId}`, 'DELETE'),
    },

    /**
     * Sensor Application API Methods
     * These methods handle user sensor data and interactions.
     * They are designed to be used in the context of user sensor management.
     */
    sensorApplication: {
      listScanEvents: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<ScanEvent[]>(`/sensor/collections/scans${params}`)
      },

      createScanEvent: (_context: AccountContext, userPosition: any, trailId?: string) =>
        API.send<ScanEvent>('/sensor/collections/scans', 'POST', { userPosition, trailId }),
    },

    /**
     * Account Application API Methods
     * These methods handle account creation, session management, and SMS verification.
     * They are designed to be used in the context of user account management.
     */
    accountApplication: {
      requestSMSCode: (phoneNumber: string) => API.send<SMSCodeRequest>('/account/sms/request', 'POST', { phoneNumber }),

      verifySMSCode: (phoneNumber: string, code: string) => API.send<SMSVerificationResult>('/account/sms/verify', 'POST', { phoneNumber, code }),

      getAccount: (_context: AccountContext) => API.send<Account | null>('/account/collections/accounts'),

      updateAccount: (_context: AccountContext, data: AccountUpdateData) => API.send<Account>('/account/collections/accounts', 'PUT', data),

      uploadAvatar: (_context: AccountContext, base64Data: string) => API.send<Account>('/account/avatar', 'POST', { base64Data }),

      validateSession: (sessionToken: string) => API.send<SessionValidationResult>('/account/session/validate', 'POST', { sessionToken }),

      revokeSession: (sessionToken: string) => API.send<void>('/account/session/revoke', 'POST', { sessionToken }),

      createLocalAccount: () => API.send<AccountSession>('/account/local-account', 'POST'),

      upgradeToPhoneAccount: (_context: AccountContext, phoneNumber: string, code: string) =>
        API.send<AccountSession>('/account/upgrade-account', 'POST', { phoneNumber, code }),

      getFirebaseConfig: (_context: AccountContext) => API.send<FirebaseConfig>('/account/config/firebase'),
    },

    /**
     * Community Application API Methods
     * These methods handle community creation, joining, and member management.
     */
    communityApplication: {
      createCommunity: (_context: AccountContext, input: { name: string; trailIds: string[] }) =>
        API.send<Community>('/community/collections/communities', 'POST', { name: input.name, trailIds: input.trailIds }),

      joinCommunity: (_context: AccountContext, inviteCode: string) =>
        API.send<Community>('/community/join', 'POST', { inviteCode }),

      leaveCommunity: (_context: AccountContext, communityId: string) =>
        API.send<void>(`/community/collections/communities/${communityId}/leave`, 'POST'),

      getCommunity: (_context: AccountContext, communityId: string) =>
        API.send<Community | undefined>(`/community/collections/communities/${communityId}`),

      listCommunities: (_context: AccountContext) =>
        API.send<Community[]>('/community/collections/communities'),

      listCommunityMembers: (_context: AccountContext, communityId: string) =>
        API.send<CommunityMember[]>(`/community/collections/communities/${communityId}/members`),

      shareDiscovery: (_context: AccountContext, discoveryId: string, communityId: string) =>
        API.send<SharedDiscovery>(`/community/collections/communities/${communityId}/discoveries/${discoveryId}/share`, 'POST'),

      unshareDiscovery: (_context: AccountContext, discoveryId: string, communityId: string) =>
        API.send<void>(`/community/collections/communities/${communityId}/discoveries/${discoveryId}/share`, 'DELETE'),

      getSharedDiscoveries: (_context: AccountContext, communityId: string) =>
        API.send<Discovery[]>(`/community/collections/communities/${communityId}/discoveries`),
    },
  }
}

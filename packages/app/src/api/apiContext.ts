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
  DiscoverySpot,
  DiscoveryStats,
  DiscoveryTrail,
  FirebaseConfig,
  LocationWithDirection,
  RatingSummary,
  ScanEvent,
  SessionValidationResult,
  SharedDiscovery,
  SMSCodeRequest,
  SMSVerificationResult,
  Spot,
  SpotPreview,
  SpotRating,
  Trail,
  TrailRating,
  TrailSpot,
  TrailStats
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

export type APIContext = Omit<ApplicationContract, 'none'> & {
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
        API.send<DiscoveryLocationRecord>('/discovery/actions/process-location', 'POST', { locationWithDirection, trailId }),

      getDiscoveries: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<Discovery[]>(`/discovery/discoveries${params}`)
      },

      getDiscovery: (_context: AccountContext, discoveryId: string) => API.send<Discovery>(`/discovery/discoveries/${discoveryId}`),

      getDiscoveredSpots: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<DiscoverySpot[]>(`/discovery/spots${params}`)
      },

      getDiscoveredSpotIds: async (_context: AccountContext, trailId?: string) => {
        const discoveries = await API.send<Discovery[]>(`/discovery/discoveries${trailId ? `?trailId=${trailId}` : ''}`)
        return { data: discoveries.data?.map(d => d.spotId) || [] }
      },

      getDiscoveredPreviewClues: (_context: AccountContext, trailId: string) => API.send<Clue[]>(`/discovery/trails/${trailId}/clues`),

      getDiscoveryTrail: (_context: AccountContext, trailId: string) => API.send<DiscoveryTrail>(`/discovery/trails/${trailId}`),

      // Profile methods
      getDiscoveryProfile: (_context: AccountContext) => API.send<DiscoveryProfile>('/discovery/profile'),

      updateDiscoveryProfile: (_context: AccountContext, updateData: DiscoveryProfileUpdateData) => API.send<DiscoveryProfile>('/discovery/profile', 'PUT', updateData),

      getDiscoveryStats: (_context: AccountContext, discoveryId: string) => API.send<DiscoveryStats>(`/discovery/discoveries/${discoveryId}/stats`),

      // Content methods
      getDiscoveryContent: (_context: AccountContext, discoveryId: string) => API.send<DiscoveryContent | undefined>(`/discovery/discoveries/${discoveryId}/content`),

      upsertDiscoveryContent: (_context: AccountContext, discoveryId: string, content: { imageUrl?: string; comment?: string }) =>
        API.send<DiscoveryContent>(`/discovery/discoveries/${discoveryId}/content`, 'PUT', content),

      deleteDiscoveryContent: (_context: AccountContext, discoveryId: string) =>
        API.send<void>(`/discovery/discoveries/${discoveryId}/content`, 'DELETE'),

      // Rating methods
      rateSpot: (_context: AccountContext, spotId: string, rating: number) =>
        API.send<SpotRating>(`/spot/spots/${spotId}/ratings`, 'POST', { rating }),

      removeSpotRating: (_context: AccountContext, spotId: string) =>
        API.send<void>(`/spot/spots/${spotId}/ratings`, 'DELETE'),

      getSpotRatingSummary: (_context: AccountContext, spotId: string) =>
        API.send<RatingSummary>(`/spot/spots/${spotId}/ratings`),

      getDiscoveryTrailStats: (_context: AccountContext, trailId: string) =>
        API.send<TrailStats>(`/trail/trails/${trailId}/stats`),
    },

    /**
     * Spot Application API Methods
     * These methods handle spot retrieval and management.
     * Note: Rating methods are available but should be accessed via discoveryApplication for proper access control.
     */
    spotApplication: {
      getSpot: (_context: AccountContext, id: string) => API.send<Spot | undefined>(`/spot/spots/${id}`),

      getSpots: (_context?: AccountContext) => { throw new Error('Method not implemented. Use getSpotsByIds or getSpotPreviews instead.') },

      getSpotsByIds: (_context: AccountContext, spotIds: string[]) => API.send<Spot[]>('/spot/queries/by-ids', 'POST', { spotIds }),

      getSpotPreviews: () => API.send<SpotPreview[]>('/spot/previews'),

      getSpotPreviewsByIds: (_context: AccountContext, spotIds: string[]) => API.send<SpotPreview[]>('/spot/queries/previews-by-ids', 'POST', { spotIds }),

      createSpot: (_context: AccountContext, spotData: Omit<Spot, 'id' | 'slug'>) => API.send<Spot>('/spot/spots', 'POST', spotData),

      // Rating methods (prefer using discoveryApplication.rateSpot for access control)
      rateSpot: (_context: AccountContext, spotId: string, rating: number) =>
        API.send('/spot/spots/' + spotId + '/ratings', 'POST', { rating }),

      removeSpotRating: (_context: AccountContext, spotId: string) =>
        API.send('/spot/spots/' + spotId + '/ratings', 'DELETE'),

      getSpotRatingSummary: (_context: AccountContext, spotId: string) =>
        API.send('/spot/spots/' + spotId + '/ratings'),
    },

    /**
     * Trail Application API Methods
     * These methods handle trail and spot management.
     * They are designed to be used in the context of trail and spot data management.
     */
    trailApplication: {
      listTrails: (_context: AccountContext) => API.send<Trail[]>('/trail/trails'),

      getTrail: (_context: AccountContext, id: string) => API.send<Trail | undefined>(`/trail/trails/${id}`),

      createTrail: (_context: AccountContext, trail: any) => API.send<Trail>('/trail/trails', 'POST', trail),

      getTrailSpotIds: (_context: AccountContext, trailId: string) => API.send<string[]>(`/trail/trails/${trailId}/spots`),

      listTrailSpots: (_context: AccountContext, trailId: string) => API.send<Spot[]>(`/trail/trails/${trailId}/spots`),

      addSpotToTrail: (_context: AccountContext, trailId: string, spotId: string, order?: number) =>
        API.send<TrailSpot>(`/trail/trails/${trailId}/spots/${spotId}`, 'POST', { order }),

      removeSpotFromTrail: (_context: AccountContext, trailId: string, spotId: string) =>
        API.send<void>(`/trail/trails/${trailId}/spots/${spotId}`, 'DELETE'),

      rateTrail: (_context: AccountContext, trailId: string, rating: number) =>
        API.send<TrailRating>(`/trail/trails/${trailId}/ratings`, 'POST', { rating }),

      removeTrailRating: (_context: AccountContext, trailId: string) =>
        API.send<void>(`/trail/trails/${trailId}/ratings`, 'DELETE'),

      getTrailRatingSummary: (_context: AccountContext, trailId: string) =>
        API.send<RatingSummary>(`/trail/trails/${trailId}/ratings`),
    },

    /**
     * Sensor Application API Methods
     * These methods handle user sensor data and interactions.
     * They are designed to be used in the context of user sensor management.
     */
    sensorApplication: {
      listScanEvents: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<ScanEvent[]>(`/sensor/scans${params}`)
      },

      createScanEvent: (_context: AccountContext, userPosition: any, trailId?: string) =>
        API.send<ScanEvent>('/sensor/scans', 'POST', { userPosition, trailId }),
    },

    /**
     * Account Application API Methods
     * These methods handle account creation, session management, and SMS verification.
     * They are designed to be used in the context of user account management.
     */
    accountApplication: {
      requestSMSCode: (phoneNumber: string) => API.send<SMSCodeRequest>('/account/actions/request-sms', 'POST', { phoneNumber }),

      verifySMSCode: (phoneNumber: string, code: string) => API.send<SMSVerificationResult>('/account/actions/verify-sms', 'POST', { phoneNumber, code }),

      getAccount: (_context: AccountContext) => API.send<Account | null>('/account/profile'),

      updateAccount: (_context: AccountContext, data: AccountUpdateData) => API.send<Account>('/account/profile', 'PUT', data),

      uploadAvatar: (_context: AccountContext, base64Data: string) => API.send<Account>('/account/profile/avatar', 'POST', { base64Data }),

      validateSession: (sessionToken: string) => API.send<SessionValidationResult>('/account/actions/validate-session', 'POST', { sessionToken }),

      revokeSession: (sessionToken: string) => API.send<void>('/account/actions/revoke-session', 'POST', { sessionToken }),

      createLocalAccount: () => API.send<AccountSession>('/account/actions/create-local', 'POST'),

      upgradeToPhoneAccount: (_context: AccountContext, phoneNumber: string, code: string) =>
        API.send<AccountSession>('/account/actions/upgrade-to-phone', 'POST', { phoneNumber, code }),

      getFirebaseConfig: (_context: AccountContext) => API.send<FirebaseConfig>('/account/config/firebase'),
    },

    /**
     * Community Application API Methods
     * These methods handle community creation, joining, and member management.
     */
    communityApplication: {
      createCommunity: (_context: AccountContext, input: { name: string; trailIds: string[] }) =>
        API.send<Community>('/community/communities', 'POST', { name: input.name, trailIds: input.trailIds }),

      joinCommunity: (_context: AccountContext, inviteCode: string) =>
        API.send<Community>('/community/actions/join', 'POST', { inviteCode }),

      leaveCommunity: (_context: AccountContext, communityId: string) =>
        API.send<void>(`/community/communities/${communityId}/actions/leave`, 'POST'),

      removeCommunity: (_context: AccountContext, communityId: string) =>
        API.send<void>(`/community/communities/${communityId}`, 'DELETE'),

      getCommunity: (_context: AccountContext, communityId: string) =>
        API.send<Community | undefined>(`/community/communities/${communityId}`),

      listCommunities: (_context: AccountContext) =>
        API.send<Community[]>('/community/communities'),

      listCommunityMembers: (_context: AccountContext, communityId: string) =>
        API.send<CommunityMember[]>(`/community/communities/${communityId}/members`),

      shareDiscovery: (_context: AccountContext, discoveryId: string, communityId: string) =>
        API.send<SharedDiscovery>(`/community/communities/${communityId}/discoveries/${discoveryId}/share`, 'POST'),

      unshareDiscovery: (_context: AccountContext, discoveryId: string, communityId: string) =>
        API.send<void>(`/community/communities/${communityId}/discoveries/${discoveryId}/share`, 'DELETE'),

      getSharedDiscoveries: (_context: AccountContext, communityId: string) =>
        API.send<Discovery[]>(`/community/communities/${communityId}/discoveries`),
    },
  }
}

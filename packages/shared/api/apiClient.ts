/**
 * API Client Facade
 * Domain-grouped, Result<T>-returning interface for Oak REST API
 */

import type { Account, AccountPublicProfile, AccountSession, AccountUpdateData, ClientAudience, DeviceToken, SMSCodeRequest, SMSVerificationResult } from '../contracts/accounts.ts'
import type { Community, CommunityMember, SharedDiscovery } from '../contracts/communities.ts'
import type { ActivateTrailResult, DiscoveryState } from '../contracts/composites.ts'
import type { FirebaseConfig } from '../contracts/config.ts'
import type { FeedbackRequest } from '../contracts/content.ts'
import type { Clue, Discovery, DiscoveryContent, DiscoveryLocationRecord, DiscoverySpot, DiscoveryStats, DiscoveryTrail, LocationWithDirection, UpsertDiscoveryContentRequest, WelcomeDiscoveryResult } from '../contracts/discoveries.ts'
import type { DiscoveryProfile, DiscoveryProfileUpdateData } from '../contracts/discoveryProfile.ts'
import type { Result } from '../contracts/results.ts'
import type { ScanEvent } from '../contracts/sensors.ts'
import type { CreateSpotRequest, RatingSummary, Spot, SpotPreview, SpotRating, UpdateSpotRequest } from '../contracts/spots.ts'
import type { CreateTrailRequest, Trail, TrailRating, TrailStats, UpdateTrailRequest } from '../contracts/trails.ts'
import type { StoredTrailSpot, TrailSpot } from '../contracts/trailSpots.ts'
import type { GeoLocation } from '../geo/index.ts'
import { HttpClient, type HttpClientConfig } from './httpClient.ts'

export interface PageMeta {
  hasMore: boolean
  nextCursor?: string
  limit?: number
}

// Wraps an HTTP call in Result<T>
async function call<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const result = await fn()
    // If the server returned a Result object (e.g., error response), return it as-is
    if (result && typeof result === 'object' && 'success' in result) {
      return result as unknown as Result<T>
    }
    // Otherwise wrap data in success result
    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: { code: 'HTTP_ERROR', message } }
  }
}

// Wraps a paged HTTP call
async function callPaged<T>(
  fn: () => Promise<T[]>,
  _query?: { limit?: number },
): Promise<Result<T[]>> {
  try {
    const result = await fn()
    // If the server returned a Result object (e.g., error response), return it as-is
    if (result && typeof result === 'object' && 'success' in result) {
      return result as unknown as Result<T[]>
    }
    // Otherwise wrap data in success result with pagination meta
    const meta: PageMeta = {
      hasMore: false,
      nextCursor: undefined,
      limit: _query?.limit,
    }
    return { success: true, data: result as T[], meta }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: { code: 'HTTP_ERROR', message } }
  }
}

export type { HttpClientConfig as ApiClientConfig }

export function createApiClient(config: HttpClientConfig) {
  const client = new HttpClient(config)

  return {
    system: {
      getManifest: () => call<{ name: string; version: string; description?: string }>(() => client.get('/')),
      getStatus: () => call<{ status: string; message: string }>(() => client.get('/status')),
    },

    spots: {
      list: (query?: { limit?: number; cursor?: string | null; orderBy?: string }) =>
        callPaged<Spot>(() => client.get<Spot[]>('/spot/spots', query as any), query),

      listPreviews: (query?: { limit?: number; cursor?: string | null; ids?: string }) =>
        callPaged<SpotPreview>(() => client.get<SpotPreview[]>('/spot/previews', query as any), query),

      get: (id: string) =>
        call<Spot | undefined>(() => client.get(`/spot/spots/${id}`)),

      getPreview: (id: string) =>
        call<SpotPreview | undefined>(() => client.get(`/spot/spots/${id}/preview`)),

      create: (body: CreateSpotRequest) =>
        call<Spot>(() => client.post('/spot/spots', body)),

      update: (id: string, body: UpdateSpotRequest) =>
        call<Spot>(() => client.put(`/spot/spots/${id}`, body)),

      delete: (id: string) =>
        call<void>(() => client.delete(`/spot/spots/${id}`)),

      rate: (id: string, rating: number) =>
        call<SpotRating>(() => client.post(`/spot/spots/${id}/ratings`, { rating })),

      getRatingSummary: (id: string) =>
        call<RatingSummary>(() => client.get(`/spot/spots/${id}/ratings`)),

      removeRating: (spotId: string) =>
        call<void>(() => client.delete(`/spot/spots/${spotId}/ratings`)),

      getByIds: (ids: string[]) =>
        call<Spot[]>(() => client.post<Spot[]>('/spot/spots/batch', { ids })),
    },

    trails: {
      list: (query?: { limit?: number; cursor?: string | null; createdBy?: string }) =>
        callPaged<Trail>(() => client.get<Trail[]>('/trail/trails', query as any), query),

      get: (id: string) =>
        call<Trail | undefined>(() => client.get(`/trail/trails/${id}`)),

      create: (body: CreateTrailRequest) =>
        call<Trail>(() => client.post('/trail/trails', body)),

      update: (id: string, body: UpdateTrailRequest) =>
        call<Trail>(() => client.put(`/trail/trails/${id}`, body)),

      delete: (id: string) =>
        call<void>(() => client.delete(`/trail/trails/${id}`)),

      listSpots: (trailId: string, _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<TrailSpot>(() => client.get<TrailSpot[]>(`/trail/trails/${trailId}/spots`)),

      getStats: (trailId: string) =>
        call<TrailStats>(() => client.get(`/trail/trails/${trailId}/stats`)),

      addSpot: (trailId: string, spotId: string, order?: number) =>
        call<StoredTrailSpot>(() => client.post(`/trail/trails/${trailId}/spots/${spotId}`, { order })),

      removeSpot: (trailId: string, spotId: string) =>
        call<void>(() => client.delete(`/trail/trails/${trailId}/spots/${spotId}`)),

      getRatingSummary: (trailId: string) =>
        call<RatingSummary>(() => client.get(`/trail/trails/${trailId}/ratings`)),

      rate: (trailId: string, rating: number) =>
        call<TrailRating>(() => client.post(`/trail/trails/${trailId}/ratings`, { rating })),

      removeRating: (trailId: string) =>
        call<void>(() => client.delete(`/trail/trails/${trailId}/ratings`)),
    },

    discovery: {
      processLocation: (trailId: string, locationWithDirection: LocationWithDirection) =>
        call<DiscoveryLocationRecord>(() => client.post('/discovery/actions/process-location', { trailId, locationWithDirection })),

      list: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged<Discovery>(() => client.get<Discovery[]>('/discovery/discoveries', query as any), query),

      get: (id: string) =>
        call<Discovery | undefined>(() => client.get(`/discovery/discoveries/${id}`)),

      listSpots: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged<DiscoverySpot>(() => client.get<DiscoverySpot[]>('/discovery/spots', query as any), query),

      listPreviewClues: (trailId: string, _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<Clue>(() => client.get<Clue[]>(`/discovery/trails/${trailId}/clues`)),

      getTrail: (trailId: string) =>
        call<DiscoveryTrail>(() => client.get(`/discovery/trails/${trailId}`)),

      getProfile: () =>
        call<DiscoveryProfile>(() => client.get('/discovery/profile')),

      updateProfile: (body: DiscoveryProfileUpdateData) =>
        call<DiscoveryProfile>(() => client.put('/discovery/profile', body)),

      getStats: (discoveryId: string) =>
        call<DiscoveryStats>(() => client.get(`/discovery/discoveries/${discoveryId}/stats`)),

      getContent: (discoveryId: string) =>
        call<DiscoveryContent | undefined>(() => client.get(`/discovery/discoveries/${discoveryId}/content`)),

      upsertContent: (discoveryId: string, body: UpsertDiscoveryContentRequest) =>
        call<DiscoveryContent>(() => client.put(`/discovery/discoveries/${discoveryId}/content`, body)),

      deleteContent: (discoveryId: string) =>
        call<void>(() => client.delete(`/discovery/discoveries/${discoveryId}/content`)),

      createWelcome: (location: GeoLocation) =>
        call<WelcomeDiscoveryResult>(() => client.post('/discovery/welcome', { location })),
    },

    account: {
      requestSMSCode: (phoneNumber: string) =>
        call<SMSCodeRequest>(() => client.post('/account/actions/request-sms', { phoneNumber })),

      verifySMSCode: (phoneNumber: string, code: string, clientAudience?: ClientAudience) =>
        call<SMSVerificationResult>(() => client.post('/account/actions/verify-sms', { phoneNumber, code, client: clientAudience })),

      getPublicProfile: (accountId: string) =>
        call<AccountPublicProfile>(() => client.get(`/account/public/profiles/${accountId}`)),

      getPublicProfiles: (accountIds: string[]) =>
        call<AccountPublicProfile[]>(() => client.post('/account/public/profiles', { accountIds })),

      getProfile: () =>
        call<Account | null>(() => client.get('/account/profile')),

      updateProfile: (body: AccountUpdateData) =>
        call<Account>(() => client.put('/account/profile', body)),

      uploadAvatar: (base64Data: string) =>
        call<Account>(() => client.post('/account/profile/avatar', { base64Data })),

      validateSession: (sessionToken: string) =>
        call<AccountSession>(() => client.post('/account/actions/validate-session', { sessionToken })),

      revokeSession: (sessionToken: string) =>
        call<void>(() => client.post('/account/actions/revoke-session', { sessionToken })),

      createLocalAccount: () =>
        call<AccountSession>(() => client.post('/account/actions/create-local')),

      upgradeToPhoneAccount: (phoneNumber: string, code: string) =>
        call<AccountSession>(() => client.post('/account/actions/upgrade-to-phone', { phoneNumber, code })),

      getFirebaseConfig: () =>
        call<FirebaseConfig>(() => client.get('/account/config/firebase')),

      registerDeviceToken: (token: string, platform?: 'ios' | 'android' | 'web') =>
        call<DeviceToken>(() => client.post('/account/device-token', { token, platform })),

      removeDeviceToken: (token: string) =>
        call<void>(() => client.delete('/account/device-token', { token })),
    },

    community: {
      create: (name: string, trailIds?: string[]) =>
        call<Community>(() => client.post('/community/communities', { name, trailIds })),

      join: (inviteCode: string) =>
        call<Community>(() => client.post('/community/actions/join', { inviteCode })),

      list: (_query?: { limit?: number; cursor?: string | null }) =>
        callPaged<Community>(() => client.get<Community[]>('/community/communities')),

      get: (communityId: string) =>
        call<Community | undefined>(() => client.get(`/community/communities/${communityId}`)),

      update: (communityId: string, body: { name?: string; trailIds?: string[] }) =>
        call<Community>(() => client.put(`/community/communities/${communityId}`, body)),

      leave: (communityId: string) =>
        call<void>(() => client.post(`/community/communities/${communityId}/actions/leave`)),

      delete: (communityId: string) =>
        call<void>(() => client.delete(`/community/communities/${communityId}`)),

      listMembers: (communityId: string, _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<CommunityMember>(() => client.get<CommunityMember[]>(`/community/communities/${communityId}/members`)),

      shareDiscovery: (communityId: string, discoveryId: string) =>
        call<SharedDiscovery>(() => client.post(`/community/communities/${communityId}/discoveries/${discoveryId}/share`)),

      unshareDiscovery: (communityId: string, discoveryId: string) =>
        call<void>(() => client.delete(`/community/communities/${communityId}/discoveries/${discoveryId}/share`)),

      listSharedDiscoveries: (communityId: string, _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<Discovery>(() => client.get<Discovery[]>(`/community/communities/${communityId}/discoveries`)),
    },

    sensors: {
      listScans: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged<ScanEvent>(() => client.get<ScanEvent[]>('/sensor/scans', query as any), query),

      createScan: (body?: { userPosition?: GeoLocation; trailId?: string }) =>
        call<ScanEvent>(() => client.post('/sensor/scans', body)),
    },

    content: {
      getPage: (language: 'en' | 'de', page: string) =>
        call<{ content: string }>(() => client.get(`/content/pages/${language}/${page}`)),

      listBlogPosts: (language: 'en' | 'de', _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<{ slug: string; title: string; date: string; excerpt?: string }>(() => client.get<{ slug: string; title: string; date: string; excerpt?: string }[]>(`/content/blog/${language}`)),

      getBlogPost: (language: 'en' | 'de', slug: string) =>
        call<{ slug: string; title: string; content: string; date: string }>(() => client.get(`/content/blog/${language}/${slug}`)),

      submitFeedback: (body: FeedbackRequest) =>
        call<{ success: boolean }>(() => client.post('/content/feedback', body)),
    },

    composite: {
      listAccessibleSpots: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged<Spot>(() => client.get<Spot[]>('/composite/spots/accessible', query as any), query),

      getDiscoveryState: () =>
        call<DiscoveryState>(() => client.get('/composite/discovery/state')),

      activateTrail: (trailId: string) =>
        call<ActivateTrailResult>(() => client.post('/composite/discovery/actions/activate-trail', { trailId })),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

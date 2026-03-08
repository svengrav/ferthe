/**
 * API Client Facade
 * Domain-grouped, Result<T>-returning interface for Oak REST API
 */

import type { Account, AccountPublicProfile, AccountSession, AccountUpdateData, ClientAudience, DeviceToken, SessionValidationResult, SMSCodeRequest, SMSVerificationResult } from '../contracts/accounts.ts'
import type { Community, CommunityMember, SharedDiscovery } from '../contracts/communities.ts'
import type { ActivateTrailResult, DiscoveryState } from '../contracts/composites.ts'
import type { FirebaseConfig } from '../contracts/config.ts'
import type { FeedbackRequest } from '../contracts/content.ts'
import type { Clue, Discovery, DiscoveryLocationRecord, DiscoverySpot, DiscoveryStats, DiscoveryTrail, LocationWithDirection, WelcomeDiscoveryResult } from '../contracts/discoveries.ts'
import type { Story, UpsertStoryRequest } from '../contracts/stories.ts'
import type { DiscoveryProfile, DiscoveryProfileUpdateData } from '../contracts/discoveryProfile.ts'
import type { Result } from '../contracts/results.ts'
import type { ScanEvent } from '../contracts/sensors.ts'
import type { CreateSpotRequest, RatingSummary, Spot, SpotPreview, SpotRating, UpdateSpotRequest } from '../contracts/spots.ts'
import type { StumbleSuggestionResult, StumbleSuggestionsQuery, StumbleVisit } from '../contracts/stumble.ts'
import type { CreateTrailRequest, Trail, TrailRating, TrailStats, UpdateTrailRequest } from '../contracts/trails.ts'
import type { StoredTrailSpot, TrailSpot } from '../contracts/trailSpots.ts'
import type { GeoLocation } from '../geo/index.ts'
import { HttpClient, type HttpClientConfig } from './httpClient.ts'
import { routes } from './routes.ts'

/** Replaces :param segments with values from the params record */
const buildPath = (template: string, params?: Record<string, string>): string =>
  params
    ? Object.entries(params).reduce((path, [k, v]) => path.replace(`:${k}`, v), template)
    : template

export interface PageMeta {
  hasMore: boolean
  nextCursor?: string
  limit?: number
}

// Passes through the server Result<T> envelope; catches network/parse errors
async function call<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: { code: 'HTTP_ERROR', message } }
  }
}

// Same as call() — Result<T[]> from server is passed through directly
async function callPaged<T>(fn: () => Promise<Result<T[]>>, _query?: { limit?: number }): Promise<Result<T[]>> {
  try {
    return await fn()
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
      getManifest: () => call<{ name: string; version: string; description?: string }>(() => client.get(routes.system.getManifest.path)),
      getStatus: () => call<{ status: string; message: string }>(() => client.get(routes.system.getStatus.path)),
    },

    spot: {
      listSpots: (query?: { limit?: number; cursor?: string | null; orderBy?: string }) =>
        callPaged<Spot>(() => client.get<Spot[]>(routes.spot.listSpots.path, query as any), query),

      listPreviews: (query?: { limit?: number; cursor?: string | null; ids?: string }) =>
        callPaged<SpotPreview>(() => client.get<SpotPreview[]>(routes.spot.listPreviews.path, query as any), query),

      getSpot: (id: string) =>
        call<Spot | undefined>(() => client.get(buildPath(routes.spot.getSpot.path, { id }))),

      getSpotPreview: (id: string) =>
        call<SpotPreview | undefined>(() => client.get(buildPath(routes.spot.getSpotPreview.path, { id }))),

      getSpotsByIds: (ids: string[]) =>
        call<Spot[]>(() => client.post<Spot[]>(routes.spot.getSpotsByIds.path, { ids })),

      createSpot: (body: CreateSpotRequest) =>
        call<Spot>(() => client.post(routes.spot.createSpot.path, body)),

      updateSpot: (id: string, body: UpdateSpotRequest) =>
        call<Spot>(() => client.put(buildPath(routes.spot.updateSpot.path, { id }), body)),

      deleteSpot: (id: string) =>
        call<void>(() => client.delete(buildPath(routes.spot.deleteSpot.path, { id }))),

      getSpotRatings: (id: string) =>
        call<RatingSummary>(() => client.get(buildPath(routes.spot.getSpotRatings.path, { spotId: id }))),

      rateSpot: (id: string, rating: number) =>
        call<SpotRating>(() => client.post(buildPath(routes.spot.rateSpot.path, { spotId: id }), { rating })),

      removeSpotRating: (spotId: string) =>
        call<void>(() => client.delete(buildPath(routes.spot.removeSpotRating.path, { spotId }))),
    },

    trail: {
      listTrails: (query?: { limit?: number; cursor?: string | null; createdBy?: string }) =>
        callPaged<Trail>(() => client.get<Trail[]>(routes.trail.listTrails.path, query as any), query),

      getTrail: (id: string) =>
        call<Trail | undefined>(() => client.get(buildPath(routes.trail.getTrail.path, { id }))),

      createTrail: (body: CreateTrailRequest) =>
        call<Trail>(() => client.post(routes.trail.createTrail.path, body)),

      updateTrail: (id: string, body: UpdateTrailRequest) =>
        call<Trail>(() => client.put(buildPath(routes.trail.updateTrail.path, { id }), body)),

      deleteTrail: (id: string) =>
        call<void>(() => client.delete(buildPath(routes.trail.deleteTrail.path, { id }))),

      getTrailSpots: (trailId: string, _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<TrailSpot>(() => client.get<TrailSpot[]>(buildPath(routes.trail.getTrailSpots.path, { trailId }))),

      getTrailStats: (trailId: string) =>
        call<TrailStats>(() => client.get(buildPath(routes.trail.getTrailStats.path, { trailId }))),

      addSpotToTrail: (trailId: string, spotId: string, order?: number) =>
        call<StoredTrailSpot>(() => client.post(buildPath(routes.trail.addSpotToTrail.path, { trailId, spotId }), { order })),

      removeSpotFromTrail: (trailId: string, spotId: string) =>
        call<void>(() => client.delete(buildPath(routes.trail.removeSpotFromTrail.path, { trailId, spotId }))),

      getTrailRatings: (trailId: string) =>
        call<RatingSummary>(() => client.get(buildPath(routes.trail.getTrailRatings.path, { trailId }))),

      rateTrail: (trailId: string, rating: number) =>
        call<TrailRating>(() => client.post(buildPath(routes.trail.rateTrail.path, { trailId }), { rating })),

      removeTrailRating: (trailId: string) =>
        call<void>(() => client.delete(buildPath(routes.trail.removeTrailRating.path, { trailId }))),
    },

    discovery: {
      processLocation: (trailId: string, locationWithDirection: LocationWithDirection) =>
        call<DiscoveryLocationRecord>(() => client.post(routes.discovery.processLocation.path, { trailId, locationWithDirection })),

      listDiscoveries: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged<Discovery>(() => client.get<Discovery[]>(routes.discovery.listDiscoveries.path, query as any), query),

      getDiscovery: (id: string) =>
        call<Discovery | undefined>(() => client.get(buildPath(routes.discovery.getDiscovery.path, { id }))),

      listDiscoveredSpots: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged<DiscoverySpot>(() => client.get<DiscoverySpot[]>(routes.discovery.listDiscoveredSpots.path, query as any), query),

      listPreviewClues: (trailId: string, _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<Clue>(() => client.get<Clue[]>(buildPath(routes.discovery.listPreviewClues.path, { trailId }))),

      getDiscoveryTrail: (trailId: string) =>
        call<DiscoveryTrail>(() => client.get(buildPath(routes.discovery.getDiscoveryTrail.path, { trailId }))),

      getProfile: () =>
        call<DiscoveryProfile>(() => client.get(routes.discovery.getProfile.path)),

      updateProfile: (body: DiscoveryProfileUpdateData) =>
        call<DiscoveryProfile>(() => client.put(routes.discovery.updateProfile.path, body)),

      getDiscoveryStats: (discoveryId: string) =>
        call<DiscoveryStats>(() => client.get(buildPath(routes.discovery.getDiscoveryStats.path, { discoveryId }))),

      createWelcome: (location: GeoLocation) =>
        call<WelcomeDiscoveryResult>(() => client.post(routes.discovery.createWelcome.path, { location })),
    },

    story: {
      getSpotStory: (discoveryId: string) =>
        call<Story | undefined>(() => client.get(buildPath(routes.story.getSpotStory.path, { discoveryId }))),

      getTrailStory: (trailId: string) =>
        call<Story | undefined>(() => client.get(buildPath(routes.story.getTrailStory.path, { trailId }))),

      upsertSpotStory: (discoveryId: string, body: UpsertStoryRequest) =>
        call<Story>(() => client.put(buildPath(routes.story.upsertSpotStory.path, { discoveryId }), body)),

      upsertTrailStory: (trailId: string, body: UpsertStoryRequest) =>
        call<Story>(() => client.put(buildPath(routes.story.upsertTrailStory.path, { trailId }), body)),

      deleteStory: (storyId: string) =>
        call<void>(() => client.delete(buildPath(routes.story.deleteStory.path, { storyId }))),

      listPublicStoriesBySpot: (spotId: string) =>
        call<Story[]>(() => client.get<Story[]>(buildPath(routes.story.listPublicStoriesBySpot.path, { spotId }))),

      listPublicStoriesByTrail: (trailId: string) =>
        call<Story[]>(() => client.get<Story[]>(buildPath(routes.story.listPublicStoriesByTrail.path, { trailId }))),

      likeStory: (storyId: string) =>
        call<Story>(() => client.post(buildPath(routes.story.likeStory.path, { storyId }), {})),

      unlikeStory: (storyId: string) =>
        call<Story>(() => client.delete(buildPath(routes.story.unlikeStory.path, { storyId }))),
    },

    account: {
      requestSMSCode: (phoneNumber: string) =>
        call<SMSCodeRequest>(() => client.post(routes.account.requestSMSCode.path, { phoneNumber })),

      verifySMSCode: (phoneNumber: string, code: string, clientAudience?: ClientAudience) =>
        call<SMSVerificationResult>(() => client.post(routes.account.verifySMSCode.path, { phoneNumber, code, client: clientAudience })),

      getPublicProfile: (accountId: string) =>
        call<AccountPublicProfile>(() => client.get(buildPath(routes.account.getPublicProfile.path, { accountId }))),

      getPublicProfiles: (accountIds: string[]) =>
        call<AccountPublicProfile[]>(() => client.post(routes.account.getPublicProfiles.path, { accountIds })),

      getProfile: () =>
        call<Account | null>(() => client.get(routes.account.getProfile.path)),

      updateProfile: (body: AccountUpdateData) =>
        call<Account>(() => client.put(routes.account.updateProfile.path, body)),

      uploadAvatar: (base64Data: string) =>
        call<Account>(() => client.post(routes.account.uploadAvatar.path, { base64Data })),

      validateSession: (sessionToken: string) =>
        call<SessionValidationResult>(() => client.post(routes.account.validateSession.path, { sessionToken })),

      revokeSession: (sessionToken: string) =>
        call<void>(() => client.post(routes.account.revokeSession.path, { sessionToken })),

      createLocalAccount: () =>
        call<AccountSession>(() => client.post(routes.account.createLocalAccount.path)),

      upgradeToPhoneAccount: (phoneNumber: string, code: string) =>
        call<AccountSession>(() => client.post(routes.account.upgradeToPhoneAccount.path, { phoneNumber, code })),

      getFirebaseConfig: () =>
        call<FirebaseConfig>(() => client.get(routes.account.getFirebaseConfig.path)),

      registerDeviceToken: (token: string, platform?: 'ios' | 'android' | 'web') =>
        call<DeviceToken>(() => client.post(routes.account.registerDeviceToken.path, { token, platform })),

      removeDeviceToken: (token: string) =>
        call<void>(() => client.delete(routes.account.removeDeviceToken.path, { token })),

      deleteAccount: () =>
        call<void>(() => client.delete(routes.account.deleteAccount.path)),

      createDevSession: (accountId: string) =>
        call<AccountSession>(() => client.post(routes.account.createDevSession.path, { accountId })),
    },

    community: {
      createCommunity: (name: string, trailIds?: string[]) =>
        call<Community>(() => client.post(routes.community.createCommunity.path, { name, trailIds })),

      joinCommunity: (inviteCode: string) =>
        call<Community>(() => client.post(routes.community.joinCommunity.path, { inviteCode })),

      listCommunities: (_query?: { limit?: number; cursor?: string | null }) =>
        callPaged<Community>(() => client.get<Community[]>(routes.community.listCommunities.path)),

      getCommunity: (communityId: string) =>
        call<Community | undefined>(() => client.get(buildPath(routes.community.getCommunity.path, { communityId }))),

      updateCommunity: (communityId: string, body: { name?: string; trailIds?: string[] }) =>
        call<Community>(() => client.put(buildPath(routes.community.updateCommunity.path, { communityId }), body)),

      leaveCommunity: (communityId: string) =>
        call<void>(() => client.post(buildPath(routes.community.leaveCommunity.path, { communityId }))),

      deleteCommunity: (communityId: string) =>
        call<void>(() => client.delete(buildPath(routes.community.deleteCommunity.path, { communityId }))),

      listMembers: (communityId: string, _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<CommunityMember>(() => client.get<CommunityMember[]>(buildPath(routes.community.listMembers.path, { communityId }))),

      shareDiscovery: (communityId: string, discoveryId: string) =>
        call<SharedDiscovery>(() => client.post(buildPath(routes.community.shareDiscovery.path, { communityId, discoveryId }))),

      unshareDiscovery: (communityId: string, discoveryId: string) =>
        call<void>(() => client.delete(buildPath(routes.community.unshareDiscovery.path, { communityId, discoveryId }))),

      listSharedDiscoveries: (communityId: string, _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<Discovery>(() => client.get<Discovery[]>(buildPath(routes.community.listSharedDiscoveries.path, { communityId }))),
    },

    sensor: {
      listScans: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged<ScanEvent>(() => client.get<ScanEvent[]>(routes.sensor.listScans.path, query as any), query),

      createScan: (body?: { userPosition?: GeoLocation; trailId?: string }) =>
        call<ScanEvent>(() => client.post(routes.sensor.createScan.path, body)),
    },

    content: {
      getPage: (language: 'en' | 'de', page: string) =>
        call<{ content: string }>(() => client.get(buildPath(routes.content.getPage.path, { language, page }))),

      listBlogPosts: (language: 'en' | 'de', _query?: { limit?: number; cursor?: string | null }) =>
        callPaged<{ slug: string; title: string; date: string; excerpt?: string }>(() => client.get<{ slug: string; title: string; date: string; excerpt?: string }[]>(buildPath(routes.content.listBlogPosts.path, { language }))),

      getBlogPost: (language: 'en' | 'de', slug: string) =>
        call<{ slug: string; title: string; content: string; date: string }>(() => client.get(buildPath(routes.content.getBlogPost.path, { language, slug }))),

      submitFeedback: (body: FeedbackRequest) =>
        call<{ success: boolean }>(() => client.post(routes.content.submitFeedback.path, body)),
    },

    composite: {
      listAccessibleSpots: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged<Spot>(() => client.get<Spot[]>(routes.composite.listAccessibleSpots.path, query as any), query),

      getDiscoveryState: () =>
        call<DiscoveryState>(() => client.get(routes.composite.getDiscoveryState.path)),

      activateTrail: (trailId: string) =>
        call<ActivateTrailResult>(() => client.post(routes.composite.activateTrail.path, { trailId })),
    },

    stumble: {
      getSuggestions: (query: StumbleSuggestionsQuery) =>
        call<StumbleSuggestionResult[]>(() => client.get<StumbleSuggestionResult[]>(routes.stumble.getSuggestions.path, query)),

      recordVisit: (poiId: string, spotId?: string) =>
        call<StumbleVisit>(() => client.post(routes.stumble.recordVisit.path, { poiId, spotId })),

      getVisits: () =>
        call<StumbleVisit[]>(() => client.get<StumbleVisit[]>(routes.stumble.getVisits.path)),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
/**
 * API Client Facade
 * Wraps the ts-rest client and provides a domain-grouped, Result<T>-returning interface.
 * Usable in both App and Web.
 */

import type { AccountUpdateData, ClientAudience } from '../contracts/accounts.ts'
import type { FeedbackRequest } from '../contracts/content.ts'
import type { LocationWithDirection, UpsertDiscoveryContentRequest } from '../contracts/discoveries.ts'
import type { DiscoveryProfileUpdateData } from '../contracts/discoveryProfile.ts'
import type { Result } from '../contracts/results.ts'
import type { CreateSpotRequest, UpdateSpotRequest } from '../contracts/spots.ts'
import type { CreateTrailRequest, UpdateTrailRequest } from '../contracts/trails.ts'
import type { GeoLocation } from '../geo/index.ts'
import { createTsRestClient, type TsRestClientConfig } from './client.ts'

export interface PageMeta {
  hasMore: boolean
  nextOffset: number
  total?: number
  limit?: number
  offset?: number
}

function toResult<T>(response: { status: number; body: any }): Result<T> {
  if (response.status === 200) {
    const body = response.body as { success: true; data: T; meta?: PageMeta }
    return { success: true, data: body.data, meta: body.meta }
  }

  const error = response.body?.error ?? {
    code: `HTTP_${response.status}`,
    message: `Request failed with status ${response.status}`,
  }
  return { success: false, error }
}

// Computes client-side pagination meta from response length + query.
// `hasMore` is true when the server returned exactly `limit` items (may have more).
// `total` is only populated when the server includes it in the response meta.
function toPaginatedResult<T>(
  response: { status: number; body: any },
  query?: { limit?: number; offset?: number },
): Result<T[]> {
  const base = toResult<T[]>(response)
  if (!base.success || !base.data) return base

  const items = base.data
  const limit = query?.limit
  const offset = query?.offset ?? 0
  const serverMeta = (response.status === 200 ? response.body?.meta : undefined) as PageMeta | undefined

  const meta: PageMeta = {
    hasMore: serverMeta?.hasMore ?? (limit !== undefined ? items.length >= limit : false),
    nextOffset: serverMeta?.nextOffset ?? (offset + items.length),
    total: serverMeta?.total,
    limit,
    offset,
  }

  return { success: true, data: items, meta }
}

export function createApiClient(config: TsRestClientConfig) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = createTsRestClient(config) as any

  return {
    system: {
      getManifest: () => c.system.getManifest({}).then(toResult),
      getStatus: () => c.system.getStatus({}).then(toResult),
    },

    spots: {
      list: (query?: { limit?: number; offset?: number; orderBy?: string }) =>
        c.spots.listSpots({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      listPreviews: (query?: { limit?: number; offset?: number; ids?: string }) =>
        c.spots.listSpotPreviews({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      get: (id: string) =>
        c.spots.getSpot({ params: { id } }).then(toResult),

      create: (body: CreateSpotRequest) =>
        c.spots.createSpot({ body }).then(toResult),

      update: (id: string, body: UpdateSpotRequest) =>
        c.spots.updateSpot({ params: { id }, body }).then(toResult),

      delete: (id: string) =>
        c.spots.deleteSpot({ params: { id } }).then(toResult),

      rate: (id: string, rating: number) =>
        c.spots.rateSpot({ params: { id }, body: { rating } }).then(toResult),

      removeRating: (spotId: string) =>
        c.spots.removeSpotRating({ params: { spotId } }).then(toResult),

      getRatingSummary: (id: string) =>
        c.spots.getSpotRatingSummary({ params: { id } }).then(toResult),

      getByIds: (ids: string[]) =>
        c.spots.getSpotsByIds({ body: { ids } }).then(toResult),
    },

    trails: {
      list: (query?: { limit?: number; offset?: number; createdBy?: string }) =>
        c.trails.listTrails({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      get: (id: string) =>
        c.trails.getTrail({ params: { id } }).then(toResult),

      create: (body: CreateTrailRequest) =>
        c.trails.createTrail({ body }).then(toResult),

      update: (id: string, body: UpdateTrailRequest) =>
        c.trails.updateTrail({ params: { id }, body }).then(toResult),

      delete: (id: string) =>
        c.trails.deleteTrail({ params: { id } }).then(toResult),

      getSpots: (trailId: string) =>
        c.trails.getTrailSpots({ params: { trailId } }).then(toResult),

      getStats: (trailId: string) =>
        c.trails.getTrailStats({ params: { trailId } }).then(toResult),

      addSpot: (trailId: string, spotId: string, order?: number) =>
        c.trails.addSpotToTrail({ params: { trailId }, body: { spotId, order } }).then(toResult),

      removeSpot: (trailId: string, spotId: string) =>
        c.trails.removeSpotFromTrail({ params: { trailId, spotId } }).then(toResult),

      getRatingSummary: (trailId: string) =>
        c.trails.getTrailRatingSummary({ params: { trailId } }).then(toResult),

      rate: (trailId: string, rating: number) =>
        c.trails.rateTrail({ params: { trailId }, body: { rating } }).then(toResult),

      removeRating: (trailId: string) =>
        c.trails.removeTrailRating({ params: { trailId } }).then(toResult),
    },

    discovery: {
      processLocation: (trailId: string, locationWithDirection: LocationWithDirection) =>
        c.discovery.processLocation({ body: { trailId, locationWithDirection } }).then(toResult),

      list: (query?: { trailId?: string; limit?: number; offset?: number }) =>
        c.discovery.listDiscoveries({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      get: (id: string) =>
        c.discovery.getDiscovery({ params: { id } }).then(toResult),

      listSpots: (query?: { trailId?: string; limit?: number; offset?: number }) =>
        c.discovery.listDiscoveredSpots({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      getPreviewClues: (trailId: string) =>
        c.discovery.getDiscoveredPreviewClues({ params: { trailId } }).then(toResult),

      getTrail: (trailId: string) =>
        c.discovery.getDiscoveryTrail({ params: { trailId } }).then(toResult),

      getProfile: () =>
        c.discovery.getDiscoveryProfile({}).then(toResult),

      updateProfile: (body: DiscoveryProfileUpdateData) =>
        c.discovery.updateDiscoveryProfile({ body }).then(toResult),

      getStats: (discoveryId: string) =>
        c.discovery.getDiscoveryStats({ params: { discoveryId } }).then(toResult),

      getContent: (discoveryId: string) =>
        c.discovery.getDiscoveryContent({ params: { discoveryId } }).then(toResult),

      upsertContent: (discoveryId: string, body: UpsertDiscoveryContentRequest) =>
        c.discovery.upsertDiscoveryContent({ params: { discoveryId }, body }).then(toResult),

      deleteContent: (discoveryId: string) =>
        c.discovery.deleteDiscoveryContent({ params: { discoveryId } }).then(toResult),

      createWelcome: (location: GeoLocation) =>
        c.discovery.createWelcomeDiscovery({ body: { location } }).then(toResult),
    },

    account: {
      requestSMSCode: (phoneNumber: string) =>
        c.account.requestSMSCode({ body: { phoneNumber } }).then(toResult),

      verifySMSCode: (phoneNumber: string, code: string, client?: ClientAudience) =>
        c.account.verifySMSCode({ body: { phoneNumber, code, client } }).then(toResult),

      getPublicProfile: (accountId: string) =>
        c.account.getPublicProfile({ params: { accountId } }).then(toResult),

      getPublicProfiles: (accountIds: string[]) =>
        c.account.getPublicProfiles({ body: { accountIds } }).then(toResult),

      getProfile: () =>
        c.account.getAccountProfile({}).then(toResult),

      updateProfile: (body: AccountUpdateData) =>
        c.account.updateAccountProfile({ body }).then(toResult),

      uploadAvatar: (base64Data: string) =>
        c.account.uploadAvatar({ body: { base64Data } }).then(toResult),

      validateSession: (sessionToken: string) =>
        c.account.validateSession({ body: { sessionToken } }).then(toResult),

      revokeSession: (sessionToken: string) =>
        c.account.revokeSession({ body: { sessionToken } }).then(toResult),

      createLocalAccount: () =>
        c.account.createLocalAccount({}).then(toResult),

      upgradeToPhoneAccount: (phoneNumber: string, code: string) =>
        c.account.upgradeToPhoneAccount({ body: { phoneNumber, code } }).then(toResult),

      getFirebaseConfig: () =>
        c.account.getFirebaseConfig({}).then(toResult),

      registerDeviceToken: (token: string, platform?: 'ios' | 'android' | 'web') =>
        c.account.registerDeviceToken({ body: { token, platform } }).then(toResult),

      removeDeviceToken: (token: string) =>
        c.account.removeDeviceToken({ body: { token } }).then(toResult),
    },

    community: {
      create: (name: string, trailIds?: string[]) =>
        c.community.createCommunity({ body: { name, trailIds } }).then(toResult),

      join: (inviteCode: string) =>
        c.community.joinCommunity({ body: { inviteCode } }).then(toResult),

      list: () =>
        c.community.listCommunities({}).then(toResult),

      get: (communityId: string) =>
        c.community.getCommunity({ params: { communityId } }).then(toResult),

      update: (communityId: string, body: { name?: string; trailIds?: string[] }) =>
        c.community.updateCommunity({ params: { communityId }, body }).then(toResult),

      leave: (communityId: string) =>
        c.community.leaveCommunity({ params: { communityId } }).then(toResult),

      delete: (communityId: string) =>
        c.community.removeCommunity({ params: { communityId } }).then(toResult),

      listMembers: (communityId: string) =>
        c.community.listCommunityMembers({ params: { communityId } }).then(toResult),

      shareDiscovery: (communityId: string, discoveryId: string) =>
        c.community.shareDiscovery({ params: { communityId, discoveryId } }).then(toResult),

      unshareDiscovery: (communityId: string, discoveryId: string) =>
        c.community.unshareDiscovery({ params: { communityId, discoveryId } }).then(toResult),

      getSharedDiscoveries: (communityId: string) =>
        c.community.getSharedDiscoveries({ params: { communityId } }).then(toResult),
    },

    sensors: {
      listScans: (trailId?: string) =>
        c.sensor.listScanEvents({ query: { trailId } }).then(r => toPaginatedResult(r)),

      createScan: (body?: { userPosition?: GeoLocation; trailId?: string }) =>
        c.sensor.createScanEvent({ body: body ?? {} }).then(toResult),
    },

    content: {
      getPage: (language: 'en' | 'de', page: string) =>
        c.content.getContentPage({ params: { language, page } }).then(toResult),

      listBlogPosts: (language: 'en' | 'de') =>
        c.content.listBlogPosts({ params: { language } }).then(toResult),

      getBlogPost: (language: 'en' | 'de', slug: string) =>
        c.content.getBlogPost({ params: { language, slug } }).then(toResult),

      submitFeedback: (body: FeedbackRequest) =>
        c.content.submitFeedback({ body }).then(toResult),
    },

    composite: {
      getAccessibleSpots: (query?: { trailId?: string; limit?: number; offset?: number }) =>
        c.composite.getAccessibleSpots({ query: query ?? {} }).then(toResult),

      getDiscoveryState: () =>
        c.composite.getDiscoveryState({}).then(toResult),

      activateTrail: (trailId: string) =>
        c.composite.activateTrail({ body: { trailId } }).then(toResult),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

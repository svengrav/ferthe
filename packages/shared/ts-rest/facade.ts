/**
 * API Client Facade
 * Wraps the ts-rest client and provides a domain-grouped, Result<T>-returning interface.
 * Usable in both App and Web.
 */

import type { AccountUpdateData } from '../contracts/accounts.ts'
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
      getManifest: () => c.getManifest({}).then(toResult),
      // Returns raw response (shape: { success, status, message } — no `data` field)
      getStatus: () => c.getStatus({}),
    },

    spots: {
      list: (query?: { limit?: number; offset?: number; orderBy?: string }) =>
        c.listSpots({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      listPreviews: (query?: { limit?: number; offset?: number; ids?: string }) =>
        c.listSpotPreviews({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      get: (id: string) =>
        c.getSpot({ params: { id } }).then(toResult),

      create: (body: CreateSpotRequest) =>
        c.createSpot({ body }).then(toResult),

      update: (id: string, body: UpdateSpotRequest) =>
        c.updateSpot({ params: { id }, body }).then(toResult),

      delete: (id: string) =>
        c.deleteSpot({ params: { id } }).then(toResult),

      rate: (id: string, rating: number) =>
        c.rateSpot({ params: { id }, body: { rating } }).then(toResult),

      removeRating: (spotId: string) =>
        c.removeSpotRating({ params: { spotId } }).then(toResult),

      getRatingSummary: (id: string) =>
        c.getSpotRatingSummary({ params: { id } }).then(toResult),

      getByIds: (ids: string[]) =>
        c.getSpotsByIds({ body: { ids } }).then(toResult),
    },

    trails: {
      list: (query?: { limit?: number; offset?: number; createdBy?: string }) =>
        c.listTrails({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      get: (id: string) =>
        c.getTrail({ params: { id } }).then(toResult),

      create: (body: CreateTrailRequest) =>
        c.createTrail({ body }).then(toResult),

      update: (id: string, body: UpdateTrailRequest) =>
        c.updateTrail({ params: { id }, body }).then(toResult),

      delete: (id: string) =>
        c.deleteTrail({ params: { id } }).then(toResult),

      getSpots: (trailId: string) =>
        c.getTrailSpots({ params: { trailId } }).then(toResult),

      getStats: (trailId: string) =>
        c.getTrailStats({ params: { trailId } }).then(toResult),

      addSpot: (trailId: string, spotId: string, order?: number) =>
        c.addSpotToTrail({ params: { trailId, spotId }, body: { order } }).then(toResult),

      removeSpot: (trailId: string, spotId: string) =>
        c.removeSpotFromTrail({ params: { trailId, spotId } }).then(toResult),

      getRatingSummary: (trailId: string) =>
        c.getTrailRatingSummary({ params: { trailId } }).then(toResult),

      rate: (trailId: string, rating: number) =>
        c.rateTrail({ params: { trailId }, body: { rating } }).then(toResult),

      removeRating: (trailId: string) =>
        c.removeTrailRating({ params: { trailId } }).then(toResult),
    },

    discovery: {
      processLocation: (trailId: string, locationWithDirection: LocationWithDirection) =>
        c.processLocation({ body: { trailId, locationWithDirection } }).then(toResult),

      list: (query?: { trailId?: string; limit?: number; offset?: number }) =>
        c.listDiscoveries({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      get: (id: string) =>
        c.getDiscovery({ params: { id } }).then(toResult),

      listSpots: (query?: { trailId?: string; limit?: number; offset?: number }) =>
        c.listDiscoveredSpots({ query: query ?? {} }).then(r => toPaginatedResult(r, query)),

      getPreviewClues: (trailId: string) =>
        c.getDiscoveredPreviewClues({ params: { trailId } }).then(toResult),

      getTrail: (trailId: string) =>
        c.getDiscoveryTrail({ params: { trailId } }).then(toResult),

      getProfile: () =>
        c.getDiscoveryProfile({}).then(toResult),

      updateProfile: (body: DiscoveryProfileUpdateData) =>
        c.updateDiscoveryProfile({ body }).then(toResult),

      getStats: (discoveryId: string) =>
        c.getDiscoveryStats({ params: { discoveryId } }).then(toResult),

      getContent: (discoveryId: string) =>
        c.getDiscoveryContent({ params: { discoveryId } }).then(toResult),

      upsertContent: (discoveryId: string, body: UpsertDiscoveryContentRequest) =>
        c.upsertDiscoveryContent({ params: { discoveryId }, body }).then(toResult),

      deleteContent: (discoveryId: string) =>
        c.deleteDiscoveryContent({ params: { discoveryId } }).then(toResult),

      createWelcome: (location: GeoLocation) =>
        c.createWelcomeDiscovery({ body: { location } }).then(toResult),
    },

    account: {
      requestSMSCode: (phoneNumber: string) =>
        c.requestSMSCode({ body: { phoneNumber } }).then(toResult),

      verifySMSCode: (phoneNumber: string, code: string) =>
        c.verifySMSCode({ body: { phoneNumber, code } }).then(toResult),

      getPublicProfile: (accountId: string) =>
        c.getPublicProfile({ params: { accountId } }).then(toResult),

      getPublicProfiles: (accountIds: string[]) =>
        c.getPublicProfiles({ body: { accountIds } }).then(toResult),

      getProfile: () =>
        c.getAccountProfile({}).then(toResult),

      updateProfile: (body: AccountUpdateData) =>
        c.updateAccountProfile({ body }).then(toResult),

      uploadAvatar: (base64Data: string) =>
        c.uploadAvatar({ body: { base64Data } }).then(toResult),

      validateSession: (sessionToken: string) =>
        c.validateSession({ body: { sessionToken } }).then(toResult),

      revokeSession: (sessionToken: string) =>
        c.revokeSession({ body: { sessionToken } }).then(toResult),

      createLocalAccount: () =>
        c.createLocalAccount({}).then(toResult),

      upgradeToPhoneAccount: (phoneNumber: string, code: string) =>
        c.upgradeToPhoneAccount({ body: { phoneNumber, code } }).then(toResult),

      getFirebaseConfig: () =>
        c.getFirebaseConfig({}).then(toResult),

      registerDeviceToken: (token: string, platform?: 'ios' | 'android' | 'web') =>
        c.registerDeviceToken({ body: { token, platform } }).then(toResult),

      removeDeviceToken: (token: string) =>
        c.removeDeviceToken({ body: { token } }).then(toResult),
    },

    community: {
      create: (name: string, trailIds?: string[]) =>
        c.createCommunity({ body: { name, trailIds } }).then(toResult),

      join: (inviteCode: string) =>
        c.joinCommunity({ body: { inviteCode } }).then(toResult),

      list: () =>
        c.listCommunities({}).then(toResult),

      get: (communityId: string) =>
        c.getCommunity({ params: { communityId } }).then(toResult),

      update: (communityId: string, body: { name?: string; trailIds?: string[] }) =>
        c.updateCommunity({ params: { communityId }, body }).then(toResult),

      leave: (communityId: string) =>
        c.leaveCommunity({ params: { communityId } }).then(toResult),

      delete: (communityId: string) =>
        c.removeCommunity({ params: { communityId } }).then(toResult),

      listMembers: (communityId: string) =>
        c.listCommunityMembers({ params: { communityId } }).then(toResult),

      shareDiscovery: (communityId: string, discoveryId: string) =>
        c.shareDiscovery({ params: { communityId, discoveryId } }).then(toResult),

      unshareDiscovery: (communityId: string, discoveryId: string) =>
        c.unshareDiscovery({ params: { communityId, discoveryId } }).then(toResult),

      getSharedDiscoveries: (communityId: string) =>
        c.getSharedDiscoveries({ params: { communityId } }).then(toResult),
    },

    sensors: {
      listScans: (trailId?: string) =>
        c.listScanEvents({ query: { trailId } }).then(r => toPaginatedResult(r)),

      createScan: (body?: { userPosition?: GeoLocation; trailId?: string }) =>
        c.createScanEvent({ body: body ?? {} }).then(toResult),
    },

    content: {
      getPage: (language: 'en' | 'de', page: string) =>
        c.getContentPage({ params: { language, page } }).then(toResult),

      listBlogPosts: (language: 'en' | 'de') =>
        c.listBlogPosts({ params: { language } }).then(toResult),

      getBlogPost: (language: 'en' | 'de', slug: string) =>
        c.getBlogPost({ params: { language, slug } }).then(toResult),

      submitFeedback: (body: FeedbackRequest) =>
        c.submitFeedback({ body }).then(toResult),
    },

    composite: {
      getAccessibleSpots: (query?: { trailId?: string; limit?: number; offset?: number }) =>
        c.getAccessibleSpots({ query: query ?? {} }).then(toResult),

      getDiscoveryState: () =>
        c.getDiscoveryState({}).then(toResult),

      activateTrail: (trailId: string) =>
        c.activateTrail({ body: { trailId } }).then(toResult),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

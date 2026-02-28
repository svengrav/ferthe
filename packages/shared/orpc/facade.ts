/**
 * API Client Facade
 * Wraps the oRPC client and provides a domain-grouped, Result<T>-returning interface.
 * Usable in both App and Web.
 */

import { ORPCError } from '@orpc/client'
import type { AccountUpdateData, ClientAudience } from '../contracts/accounts.ts'
import type { FeedbackRequest } from '../contracts/content.ts'
import type { LocationWithDirection, UpsertDiscoveryContentRequest } from '../contracts/discoveries.ts'
import type { DiscoveryProfileUpdateData } from '../contracts/discoveryProfile.ts'
import type { Result } from '../contracts/results.ts'
import type { CreateSpotRequest, UpdateSpotRequest } from '../contracts/spots.ts'
import type { CreateTrailRequest, UpdateTrailRequest } from '../contracts/trails.ts'
import type { GeoLocation } from '../geo/index.ts'
import { createOrpcClient, type OrpcClientConfig } from './client.ts'

export interface PageMeta {
  hasMore: boolean
  nextCursor?: string
  limit?: number
}

// Wraps an oRPC call in Result<T>, converting ORPCError to error result.
async function call<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (err) {
    if (err instanceof ORPCError) {
      return { success: false, error: { code: err.code, message: err.message } }
    }
    return { success: false, error: { code: 'UNKNOWN', message: String(err) } }
  }
}

// Wraps a paged oRPC call, extracting items and nextCursor from the server response.
async function callPaged<T>(
  fn: () => Promise<{ items: T[]; nextCursor?: string }>,
  query?: { limit?: number },
): Promise<Result<T[]>> {
  try {
    const { items, nextCursor } = await fn()
    const meta: PageMeta = {
      hasMore: nextCursor !== undefined,
      nextCursor,
      limit: query?.limit,
    }
    return { success: true, data: items, meta }
  } catch (err) {
    if (err instanceof ORPCError) {
      return { success: false, error: { code: err.code, message: err.message } }
    }
    return { success: false, error: { code: 'UNKNOWN', message: String(err) } }
  }
}

// Re-export config type so consumers only need one import.
export type { OrpcClientConfig as ApiClientConfig }

export function createApiClient(config: OrpcClientConfig) {
  const c = createOrpcClient(config)

  return {
    system: {
      getManifest: () => call(() => c.system.getManifest(undefined)),
      getStatus: () => call(() => c.system.getStatus(undefined)),
    },

    spots: {
      list: (query?: { limit?: number; cursor?: string | null; orderBy?: string }) =>
        callPaged(() => c.spots.list(query ?? { limit: 20 }), query),

      listPreviews: (query?: { limit?: number; cursor?: string | null; ids?: string }) =>
        callPaged(() => c.spots.listPreviews(query ?? { limit: 20 }), query),

      get: (id: string) =>
        call(() => c.spots.get({ id })),

      create: (body: CreateSpotRequest) =>
        call(() => c.spots.create(body as any)),

      update: (id: string, body: UpdateSpotRequest) =>
        call(() => c.spots.update({ id, ...body } as any)),

      delete: (id: string) =>
        call(() => c.spots.delete({ id })),

      rate: (id: string, rating: number) =>
        call(() => c.spots.rate({ id, rating })),

      getRatingSummary: (id: string) =>
        call(() => c.spots.getRatingSummary({ id })),

      removeRating: (spotId: string) =>
        call(() => c.spots.removeRating({ spotId })),

      getByIds: (ids: string[]) =>
        call(() => c.spots.getByIds({ ids })),
    },

    trails: {
      list: (query?: { limit?: number; cursor?: string | null; createdBy?: string }) =>
        callPaged(() => c.trails.list(query ?? { limit: 20 }), query),

      get: (id: string) =>
        call(() => c.trails.get({ id })),

      create: (body: CreateTrailRequest) =>
        call(() => c.trails.create(body)),

      update: (id: string, body: UpdateTrailRequest) =>
        call(() => c.trails.update({ id, ...body } as any)),

      delete: (id: string) =>
        call(() => c.trails.delete({ id })),

      listSpots: (trailId: string, query?: { limit?: number; cursor?: string | null }) =>
        callPaged(() => c.trails.listSpots({ trailId, limit: 20, ...query }), query),

      getStats: (trailId: string) =>
        call(() => c.trails.getStats({ trailId })),

      addSpot: (trailId: string, spotId: string, order?: number) =>
        call(() => c.trails.addSpot({ trailId, spotId, order })),

      removeSpot: (trailId: string, spotId: string) =>
        call(() => c.trails.removeSpot({ trailId, spotId })),

      getRatingSummary: (trailId: string) =>
        call(() => c.trails.getRatingSummary({ trailId })),

      rate: (trailId: string, rating: number) =>
        call(() => c.trails.rate({ trailId, rating })),

      removeRating: (trailId: string) =>
        call(() => c.trails.removeRating({ trailId })),
    },

    discovery: {
      processLocation: (trailId: string, locationWithDirection: LocationWithDirection) =>
        call(() => c.discovery.processLocation({ trailId, locationWithDirection })),

      list: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged(() => c.discovery.list(query ?? { limit: 20 }), query),

      get: (id: string) =>
        call(() => c.discovery.get({ id })),

      listSpots: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged(() => c.discovery.listSpots(query ?? { limit: 20 }), query),

      listPreviewClues: (trailId: string, query?: { limit?: number; cursor?: string | null }) =>
        callPaged(() => c.discovery.listPreviewClues({ trailId, limit: 20, ...query }), query),

      getTrail: (trailId: string) =>
        call(() => c.discovery.getTrail({ trailId })),

      getProfile: () =>
        call(() => c.discovery.getProfile(undefined)),

      updateProfile: (body: DiscoveryProfileUpdateData) =>
        call(() => c.discovery.updateProfile(body)),

      getStats: (discoveryId: string) =>
        call(() => c.discovery.getStats({ discoveryId })),

      getContent: (discoveryId: string) =>
        call(() => c.discovery.getContent({ discoveryId })),

      upsertContent: (discoveryId: string, body: UpsertDiscoveryContentRequest) =>
        call(() => c.discovery.upsertContent({ discoveryId, ...body } as any)),

      deleteContent: (discoveryId: string) =>
        call(() => c.discovery.deleteContent({ discoveryId })),

      createWelcome: (location: GeoLocation) =>
        call(() => c.discovery.createWelcome({ location })),
    },

    account: {
      requestSMSCode: (phoneNumber: string) =>
        call(() => c.account.requestSMSCode({ phoneNumber })),

      verifySMSCode: (phoneNumber: string, code: string, client?: ClientAudience) =>
        call(() => c.account.verifySMSCode({ phoneNumber, code, client })),

      getPublicProfile: (accountId: string) =>
        call(() => c.account.getPublicProfile({ accountId })),

      getPublicProfiles: (accountIds: string[]) =>
        call(() => c.account.getPublicProfiles({ accountIds })),

      getProfile: () =>
        call(() => c.account.getProfile(undefined)),

      updateProfile: (body: AccountUpdateData) =>
        call(() => c.account.updateProfile(body)),

      uploadAvatar: (base64Data: string) =>
        call(() => c.account.uploadAvatar({ base64Data })),

      validateSession: (sessionToken: string) =>
        call(() => c.account.validateSession({ sessionToken })),

      revokeSession: (sessionToken: string) =>
        call(() => c.account.revokeSession({ sessionToken })),

      createLocalAccount: () =>
        call(() => c.account.createLocalAccount(undefined)),

      upgradeToPhoneAccount: (phoneNumber: string, code: string) =>
        call(() => c.account.upgradeToPhoneAccount({ phoneNumber, code })),

      getFirebaseConfig: () =>
        call(() => c.account.getFirebaseConfig(undefined)),

      registerDeviceToken: (token: string, platform?: 'ios' | 'android' | 'web') =>
        call(() => c.account.registerDeviceToken({ token, platform })),

      removeDeviceToken: (token: string) =>
        call(() => c.account.removeDeviceToken({ token })),
    },

    community: {
      create: (name: string, trailIds?: string[]) =>
        call(() => c.community.create({ name, trailIds })),

      join: (inviteCode: string) =>
        call(() => c.community.join({ inviteCode })),

      list: (query?: { limit?: number; cursor?: string | null }) =>
        callPaged(() => c.community.list(query ?? { limit: 20 }), query),

      get: (communityId: string) =>
        call(() => c.community.get({ communityId })),

      update: (communityId: string, body: { name?: string; trailIds?: string[] }) =>
        call(() => c.community.update({ communityId, ...body })),

      leave: (communityId: string) =>
        call(() => c.community.leave({ communityId })),

      delete: (communityId: string) =>
        call(() => c.community.delete({ communityId })),

      listMembers: (communityId: string, query?: { limit?: number; cursor?: string | null }) =>
        callPaged(() => c.community.listMembers({ communityId, limit: 20, ...query }), query),

      shareDiscovery: (communityId: string, discoveryId: string) =>
        call(() => c.community.shareDiscovery({ communityId, discoveryId })),

      unshareDiscovery: (communityId: string, discoveryId: string) =>
        call(() => c.community.unshareDiscovery({ communityId, discoveryId })),

      listSharedDiscoveries: (communityId: string, query?: { limit?: number; cursor?: string | null }) =>
        callPaged(() => c.community.listSharedDiscoveries({ communityId, limit: 20, ...query }), query),
    },

    sensors: {
      listScans: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged(() => c.sensor.listScans(query ?? { limit: 20 }), query),

      createScan: (body?: { userPosition?: GeoLocation; trailId?: string }) =>
        call(() => c.sensor.createScan(body ?? {})),
    },

    content: {
      getPage: (language: 'en' | 'de', page: string) =>
        call(() => c.content.getPage({ language, page })),

      listBlogPosts: (language: 'en' | 'de', query?: { limit?: number; cursor?: string | null }) =>
        callPaged(() => c.content.listBlogPosts({ language, limit: 20, ...query }), query),

      getBlogPost: (language: 'en' | 'de', slug: string) =>
        call(() => c.content.getBlogPost({ language, slug })),

      submitFeedback: (body: FeedbackRequest) =>
        call(() => c.content.submitFeedback(body)),
    },

    composite: {
      listAccessibleSpots: (query?: { trailId?: string; limit?: number; cursor?: string | null }) =>
        callPaged(() => c.composite.listAccessibleSpots(query ?? { limit: 20 }), query),

      getDiscoveryState: () =>
        call(() => c.composite.getDiscoveryState(undefined)),

      activateTrail: (trailId: string) =>
        call(() => c.composite.activateTrail({ trailId })),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

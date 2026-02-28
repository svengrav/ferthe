/**
 * This file maps shared API contracts to Oak route handlers.
 * The route definitions (method, path, version, config) come from @shared/api/routes
 * This file only adds the handler implementation.
 */

import { parseQueryOptions } from '@core/api/oak/queryOptions.ts'
import { createAsyncRequestHandler } from '@core/api/oak/requestHandler.ts'
import { routes as sharedRoutes } from '@shared/api/routes.ts'
import type { HttpRoute } from '@shared/api/types.ts'

import {
  Account,
  AccountPublicProfile,
  AccountSession,
  ActivateTrailResult,
  APIContract,
  Clue,
  Community,
  CommunityMember,
  CreateSpotRequest,
  DeviceToken,
  Discovery,
  DiscoveryContent,
  DiscoveryLocationRecord,
  DiscoveryProfile,
  DiscoverySpot,
  DiscoveryState,
  DiscoveryStats,
  DiscoveryTrail,
  FirebaseConfig,
  RatingSummary,
  ScanEvent,
  SharedDiscovery,
  SMSCodeRequest,
  SMSVerificationResult,
  Spot,
  SpotPreview,
  SpotRating,
  StoredTrailSpot,
  Trail,
  TrailRating,
  TrailSpot,
  TrailStats,
  UpdateSpotRequest,
  WelcomeDiscoveryResult
} from '@shared/contracts/index.ts'
import { manifest } from './manifest.ts'
import { OakRouteHandler, Route } from './oak/types.ts'

// deno-lint-ignore no-explicit-any
type HandlerFn = OakRouteHandler

/**
 * Convert HttpRoute from shared contract + handler → Oak Route
 */
const toOakRoute = (httpRoute: HttpRoute, handler: HandlerFn): Route => ({
  method: httpRoute.method,
  version: httpRoute.version,
  url: httpRoute.path,
  config: httpRoute.config,
  handler,
})

/**
 * Create handler registry: domain → routeId → handler function
 */
const createHandlers = (ctx: APIContract): Record<string, Record<string, HandlerFn>> => {
  const { discoveryApplication, sensorApplication, trailApplication, spotApplication, accountApplication, communityApplication, contentApplication, spotAccessComposite, discoveryStateComposite, accountProfileComposite } = ctx

  // Create the request handler with account application access
  const asyncRequestHandler = createAsyncRequestHandler(accountApplication)

  return {
    // ─────────────────────────────────────────────────────────────
    // System Handlers
    // ─────────────────────────────────────────────────────────────
    system: {
      // deno-lint-ignore require-await
      getManifest: asyncRequestHandler(async () => ({
        success: true,
        data: manifest,
      })),
      // deno-lint-ignore require-await
      getStatus: asyncRequestHandler(async () => ({
        success: true,
        data: {
          status: 'ok',
          message: 'Ferthe Core API is running',
        },
      })),
    },

    // ─────────────────────────────────────────────────────────────
    // Spot Handlers
    // ─────────────────────────────────────────────────────────────
    spot: {
      listSpots: asyncRequestHandler<Spot[]>(async ({ context, query }) => {
        return await spotApplication.getSpots(context, parseQueryOptions(query))
      }),
      listPreviews: asyncRequestHandler<SpotPreview[]>(async ({ context, query }) => {
        if (query?.ids) {
          return await spotApplication.getSpotPreviewsByIds(context, query.ids.split(','))
        }
        return await spotApplication.getSpotPreviews(parseQueryOptions(query))
      }),
      getSpot: asyncRequestHandler<Spot | undefined, { id: string }, never>(async ({ params, context }) => {
        return await spotAccessComposite.getAccessibleSpot(context, params!.id)
      }),
      getSpotPreview: asyncRequestHandler<SpotPreview | undefined, { id: string }, never>(async ({ params, context }) => {
        const result = await spotApplication.getSpotPreviewsByIds(context, [params!.id])
        if (!result.success || !result.data || result.data.length === 0) {
          return { success: true, data: undefined }
        }
        return { success: true, data: result.data[0] }
      }),
      getSpotsByIds: asyncRequestHandler<Spot[], never, { ids: string[] }>(async ({ context, body }) => {
        return await spotApplication.getSpotsByIds(context, body?.ids ?? [])
      }),
      createSpot: asyncRequestHandler<Spot, never, CreateSpotRequest>(async ({ context, body }) => {
        return await spotApplication.createSpot(context, body!)
      }),
      updateSpot: asyncRequestHandler<Spot, { id: string }, UpdateSpotRequest>(async ({ params, context, body }) => {
        return await spotApplication.updateSpot(context, params!.id, body!)
      }),
      deleteSpot: asyncRequestHandler<void, { id: string }, never>(async ({ params, context }) => {
        return await spotApplication.deleteSpot(context, params!.id)
      }),
      getSpotRatings: asyncRequestHandler<RatingSummary, { spotId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getSpotRatingSummary(session, params!.spotId)
      }),
      rateSpot: asyncRequestHandler<SpotRating, { spotId: string }>(async ({ context: session, params, body }) => {
        return await discoveryApplication.rateSpot(session, params!.spotId, body.rating)
      }),
      removeSpotRating: asyncRequestHandler<void, { spotId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.removeSpotRating(session, params!.spotId)
      }),
    },

    // ─────────────────────────────────────────────────────────────
    // Trail Handlers
    // ─────────────────────────────────────────────────────────────
    trail: {
      listTrails: asyncRequestHandler<Trail[]>(async ({ context, query }) => {
        return await trailApplication.listTrails(context, parseQueryOptions(query))
      }),
      getTrail: asyncRequestHandler<Trail | undefined, { id: string }, never>(async ({ params, context }) => {
        return await trailApplication.getTrail(context, params!.id)
      }),
      createTrail: asyncRequestHandler<Trail, never, Omit<Trail, 'id'>>(async ({ context, body }) => {
        return await trailApplication.createTrail(context, body!)
      }),
      updateTrail: asyncRequestHandler<Trail, { id: string }, Partial<Trail>>(async ({ params, context, body }) => {
        return await trailApplication.updateTrail(context, params!.id, body!)
      }),
      deleteTrail: asyncRequestHandler<void, { id: string }, never>(async ({ params, context }) => {
        return await trailApplication.deleteTrail(context, params!.id)
      }),
      getTrailSpots: asyncRequestHandler<TrailSpot[]>(async ({ context, params }) => {
        return await trailApplication.getTrailSpots(context, params!.trailId)
      }),
      getTrailStats: asyncRequestHandler<TrailStats, { trailId: string }>(async ({ context, params }) => {
        return await discoveryApplication.getDiscoveryTrailStats(context, params!.trailId)
      }),
      addSpotToTrail: asyncRequestHandler<StoredTrailSpot, { trailId: string; spotId: string }, { order?: number }>(async ({ params, context, body }) => {
        return await trailApplication.addSpotToTrail(context, params!.trailId, params!.spotId, body?.order)
      }),
      removeSpotFromTrail: asyncRequestHandler<void, { trailId: string; spotId: string }, never>(async ({ params, context }) => {
        return await trailApplication.removeSpotFromTrail(context, params!.trailId, params!.spotId)
      }),
      getTrailRatings: asyncRequestHandler<RatingSummary, { trailId: string }>(async ({ context: session, params }) => {
        return await trailApplication.getTrailRatingSummary(session, params!.trailId)
      }),
      rateTrail: asyncRequestHandler<TrailRating, { trailId: string }>(async ({ context: session, params, body }) => {
        return await trailApplication.rateTrail(session, params!.trailId, body.rating)
      }),
      removeTrailRating: asyncRequestHandler<void, { trailId: string }>(async ({ context: session, params }) => {
        return await trailApplication.removeTrailRating(session, params!.trailId)
      }),
    },

    // ─────────────────────────────────────────────────────────────
    // Discovery Handlers
    // ─────────────────────────────────────────────────────────────
    discovery: {
      processLocation: asyncRequestHandler<DiscoveryLocationRecord>(async ({ context: session, body }) => {
        return await discoveryApplication.processLocation(session, body?.locationWithDirection, body?.trailId)
      }),
      listDiscoveries: asyncRequestHandler<Discovery[]>(async ({ context: session, query }) => {
        return await discoveryApplication.getDiscoveries(session, query?.trailId, parseQueryOptions(query))
      }),
      getDiscovery: asyncRequestHandler<Discovery | undefined, { id: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscovery(session, params!.id)
      }),
      listDiscoveredSpots: asyncRequestHandler<DiscoverySpot[]>(async ({ context: session, query }) => {
        return await discoveryApplication.getDiscoveredSpots(session, query?.trailId, parseQueryOptions(query))
      }),
      listPreviewClues: asyncRequestHandler<Clue[], { trailId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveredPreviewClues(session, params!.trailId)
      }),
      getDiscoveryTrail: asyncRequestHandler<DiscoveryTrail, { trailId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveryTrail(session, params!.trailId)
      }),
      getProfile: asyncRequestHandler<DiscoveryProfile>(async ({ context: session }) => {
        return await discoveryApplication.getDiscoveryProfile(session)
      }),
      updateProfile: asyncRequestHandler<DiscoveryProfile>(async ({ context: session, body }) => {
        return await discoveryApplication.updateDiscoveryProfile(session, body)
      }),
      getDiscoveryStats: asyncRequestHandler<DiscoveryStats, { discoveryId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveryStats(session, params!.discoveryId)
      }),
      getDiscoveryContent: asyncRequestHandler<DiscoveryContent | undefined, { discoveryId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveryContent(session, params!.discoveryId)
      }),
      upsertDiscoveryContent: asyncRequestHandler<DiscoveryContent, { discoveryId: string }>(async ({ context: session, params, body }) => {
        return await discoveryApplication.upsertDiscoveryContent(session, params!.discoveryId, body)
      }),
      deleteDiscoveryContent: asyncRequestHandler<void, { discoveryId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.deleteDiscoveryContent(session, params!.discoveryId)
      }),
      createWelcome: asyncRequestHandler<WelcomeDiscoveryResult>(async ({ context, body }) => {
        return await discoveryApplication.createWelcomeDiscovery(context, body.location)
      }),
    },

    // ─────────────────────────────────────────────────────────────
    // Account Handlers
    // ─────────────────────────────────────────────────────────────
    account: {
      requestSMSCode: asyncRequestHandler<SMSCodeRequest>(async ({ body }) => {
        return await accountApplication.requestSMSCode(body?.phoneNumber)
      }),
      verifySMSCode: asyncRequestHandler<SMSVerificationResult>(async ({ body }) => {
        return await accountApplication.verifySMSCode(body?.phoneNumber, body?.code)
      }),
      getPublicProfile: asyncRequestHandler<AccountPublicProfile, { accountId: string }>(async ({ context, params }) => {
        return await accountProfileComposite.getPublicProfile(context, params!.accountId)
      }),
      getPublicProfiles: asyncRequestHandler<AccountPublicProfile[], never, { accountIds: string[] }>(async ({ context, body }) => {
        return await accountProfileComposite.getPublicProfiles(context, body!.accountIds)
      }),
      getProfile: asyncRequestHandler<Account | null>(async ({ context }) => {
        return await accountApplication.getAccount(context)
      }),
      updateProfile: asyncRequestHandler<Account>(async ({ context, body }) => {
        return await accountApplication.updateAccount(context, body)
      }),
      uploadAvatar: asyncRequestHandler<Account>(async ({ context, body }) => {
        return await accountApplication.uploadAvatar(context, body?.base64Data)
      }),
      validateSession: asyncRequestHandler(async ({ body }) => {
        return await accountApplication.validateSession(body?.sessionToken)
      }),
      revokeSession: asyncRequestHandler(async ({ body }) => {
        return await accountApplication.revokeSession(body?.sessionToken)
      }),
      createLocalAccount: asyncRequestHandler(async () => {
        return await accountApplication.createLocalAccount()
      }),
      upgradeToPhoneAccount: asyncRequestHandler(async ({ context, body }) => {
        return await accountApplication.upgradeToPhoneAccount(context, body?.phoneNumber, body?.code)
      }),
      getFirebaseConfig: asyncRequestHandler<FirebaseConfig>(async ({ context }) => {
        return await accountApplication.getFirebaseConfig(context)
      }),
      registerDeviceToken: asyncRequestHandler<DeviceToken>(async ({ context, body }) => {
        return await accountApplication.registerDeviceToken(context, body?.token, body?.platform)
      }),
      removeDeviceToken: asyncRequestHandler<void>(async ({ context, body }) => {
        return await accountApplication.removeDeviceToken(context, body?.token)
      }),
      createDevSession: asyncRequestHandler<AccountSession, never, { accountId: string }>(async ({ body }) => {
        const isDevelopment = Deno.env.get('PRODUCTION')?.toLowerCase() !== 'true'
        if (!isDevelopment) {
          return { success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not available in production' } }
        }
        if (!body?.accountId) {
          return { success: false, error: { code: 'MISSING_ACCOUNT_ID', message: 'accountId is required' } }
        }
        return await accountApplication.createDevSession(body.accountId)
      }),
    },

    // ─────────────────────────────────────────────────────────────
    // Community Handlers
    // ─────────────────────────────────────────────────────────────
    community: {
      createCommunity: asyncRequestHandler<Community>(async ({ context, body }) => {
        return await communityApplication.createCommunity(context, { name: body?.name || '', trailIds: body?.trailIds || [] })
      }),
      joinCommunity: asyncRequestHandler<Community>(async ({ context, body }) => {
        return await communityApplication.joinCommunity(context, body?.inviteCode)
      }),
      listCommunities: asyncRequestHandler<Community[]>(async ({ context }) => {
        return await communityApplication.listCommunities(context)
      }),
      getCommunity: asyncRequestHandler<Community | undefined, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.getCommunity(context, params!.communityId)
      }),
      updateCommunity: asyncRequestHandler<Community, { communityId: string }>(async ({ context, params, body }) => {
        return await communityApplication.updateCommunity(context, params!.communityId, body!)
      }),
      leaveCommunity: asyncRequestHandler<void, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.leaveCommunity(context, params!.communityId)
      }),
      deleteCommunity: asyncRequestHandler<void, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.removeCommunity(context, params!.communityId)
      }),
      listMembers: asyncRequestHandler<CommunityMember[], { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.listCommunityMembers(context, params!.communityId)
      }),
      shareDiscovery: asyncRequestHandler<SharedDiscovery, { communityId: string; discoveryId: string }>(async ({ context, params }) => {
        return await communityApplication.shareDiscovery(context, params!.discoveryId, params!.communityId)
      }),
      unshareDiscovery: asyncRequestHandler<void, { communityId: string; discoveryId: string }>(async ({ context, params }) => {
        return await communityApplication.unshareDiscovery(context, params!.discoveryId, params!.communityId)
      }),
      listSharedDiscoveries: asyncRequestHandler<Discovery[], { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.getSharedDiscoveries(context, params!.communityId)
      }),
    },

    // ─────────────────────────────────────────────────────────────
    // Sensor Handlers
    // ─────────────────────────────────────────────────────────────
    sensor: {
      listScans: asyncRequestHandler(async ({ context, query }) => {
        return await sensorApplication.listScanEvents(context, query?.trailId)
      }),
      createScan: asyncRequestHandler<ScanEvent>(async ({ context: session, body }) => {
        return await sensorApplication.createScanEvent(session, body?.userPosition, body?.trailId)
      }),
    },

    // ─────────────────────────────────────────────────────────────
    // Content Handlers
    // ─────────────────────────────────────────────────────────────
    content: {
      getPage: asyncRequestHandler(async ({ params }) => {
        return await contentApplication.getPage(params!.language, params!.page)
      }),
      listBlogPosts: asyncRequestHandler(async ({ params }) => {
        return await contentApplication.listBlogPosts(params!.language)
      }),
      getBlogPost: asyncRequestHandler(async ({ params }) => {
        return await contentApplication.getBlogPost(params!.language, params!.slug)
      }),
      submitFeedback: asyncRequestHandler(async ({ body }) => {
        return await contentApplication.submitFeedback(body?.name, body?.email, body?.type, body?.message)
      }),
    },

    // ─────────────────────────────────────────────────────────────
    // Composite Handlers
    // ─────────────────────────────────────────────────────────────
    composite: {
      listAccessibleSpots: asyncRequestHandler<Spot[]>(async ({ context, query }) => {
        const options = parseQueryOptions(query)
        const trailId = query?.trailId as string | undefined
        return await spotAccessComposite.getAccessibleSpots(context, trailId, options)
      }),
      getDiscoveryState: asyncRequestHandler<DiscoveryState>(async ({ context }) => {
        return await discoveryStateComposite.getDiscoveryState(context)
      }),
      activateTrail: asyncRequestHandler<ActivateTrailResult>(async ({ context, body }) => {
        const { trailId } = body as { trailId: string }
        return await discoveryStateComposite.activateTrail(context, trailId)
      }),
    },
  }
}

/**
 * Create Oak routes from shared contract + handlers
 */
const createRoutes = (ctx: APIContract): Route[] => {
  const handlers = createHandlers(ctx)
  const oakRoutes: Route[] = []

  // Iterate over all domains in shared routes
  for (const [domain, domainRoutes] of Object.entries(sharedRoutes)) {
    for (const route of domainRoutes) {
      const handler = (handlers as Record<string, Record<string, HandlerFn>>)[domain]?.[route.id]
      if (handler) {
        oakRoutes.push(toOakRoute(route, handler))
      } else {
        console.warn(`Warning: No handler found for ${domain}.${route.id}`)
      }
    }
  }

  return oakRoutes
}

export default createRoutes

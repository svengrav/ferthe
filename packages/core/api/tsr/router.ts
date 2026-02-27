/**
 * ts-rest API Router
 * Single-file implementation of all route handlers using the typed contract.
 * Replaces Oak routes.ts — no duplicate validation, no manual Zod wrapping.
 *
 * Auth model:
 *  - Global requestMiddleware validates Bearer token → attaches `request.auth`
 *  - Public routes ignore auth (middleware sets PUBLIC_AUTH fallback)
 *  - Private route helpers return 401 if accountType === 'public'
 */

import { manifest } from '@core/api/manifest.ts'
import type { CoreContext } from '@core/core.ts'
import { logger } from '@core/shared/logger.ts'
import { ERROR_CODES } from '@shared/contracts/errors.ts'
import type { QueryOptions, Result } from '@shared/contracts/results.ts'
import { apiContract } from '@shared/ts-rest/contract.ts'
import { createFetchHandler, tsr } from '@ts-rest/serverless/fetch'

// ── Auth ──────────────────────────────────────────────────────────────────────

interface AuthContext {
  accountId: string
  accountType: 'sms_verified' | 'local_unverified' | 'public'
  role: 'user' | 'creator' | 'admin'
  client?: 'app' | 'creator'
}

const PUBLIC_AUTH: AuthContext = { accountId: 'public', accountType: 'public', role: 'user' }

// Platform context injected as second handler argument by ts-rest
interface Platform {
  request: Request & { auth: AuthContext }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Converts typed query params to QueryOptions (limit/offset already coerced by Zod)
function toQueryOptions(query?: Record<string, any>): QueryOptions | undefined {
  if (!query) return undefined
  const opts: QueryOptions = {}
  if (query.limit != null) opts.limit = query.limit
  if (query.offset != null) opts.offset = query.offset
  if (query.orderBy) opts.sortBy = query.orderBy
  if (query.createdBy) opts.filters = { createdBy: query.createdBy }
  if (query.trailId) opts.filters = { ...opts.filters as object, trailId: query.trailId }
  return Object.keys(opts).length > 0 ? opts : undefined
}

// Maps a Result<T> to a ts-rest response. Errors use the ERROR_CODES HTTP status map.
function respond<T>(result: Result<T>): any {
  if (result.success) {
    return { status: 200, body: { success: true, data: result.data } }
  }
  const errorDef = ERROR_CODES[result.error!.code as keyof typeof ERROR_CODES]
  const status = errorDef?.httpStatus ?? 500
  return { status, body: { success: false, error: result.error } }
}

// Returns a 403 response if the auth role is not in the allowed list.
const CREATOR_ROLES: AuthContext['role'][] = ['creator', 'admin']
function requireRole(auth: AuthContext, allowed: AuthContext['role'][]): any | null {
  if (allowed.includes(auth.role)) return null
  return { status: 403, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Insufficient role' } } }
}

// ── Router ────────────────────────────────────────────────────────────────────

export function createApiRouter(ctx: CoreContext) {
  const {
    discoveryApplication,
    sensorApplication,
    trailApplication,
    spotApplication,
    accountApplication,
    communityApplication,
    contentApplication,
    spotAccessComposite,
    discoveryStateComposite,
    accountProfileComposite,
  } = ctx

  return tsr.router(apiContract, {

    // ── System (public) ──────────────────────────────────────────────────────
    system: {
      getManifest: async () => ({ status: 200 as const, body: { success: true as const, data: manifest } }),
      getStatus: async () => ({ status: 200 as const, body: { success: true as const, data: { status: 'ok', message: 'Ferthe Core API is running' } } }),
    },

    // ── Spots ────────────────────────────────────────────────────────────────
    spots: {
      listSpots: async ({ query }, { request }: Platform) =>
        respond(await spotApplication.getSpots(request.auth, toQueryOptions(query))),

      listSpotPreviews: async ({ query }, { request }: Platform) => {
        if (query?.ids) {
          return respond(await spotApplication.getSpotPreviewsByIds(request.auth, (query.ids as string).split(',')))
        }
        return respond(await spotApplication.getSpotPreviews(toQueryOptions(query)))
      },

      getSpot: async ({ params }, { request }: Platform) =>
        respond(await spotAccessComposite.getAccessibleSpot(request.auth, params.id)),

      createSpot: async ({ body }, { request }: Platform) =>
        respond(await spotApplication.createSpot(request.auth, body)),

      updateSpot: async ({ params, body }, { request }: Platform) =>
        respond(await spotApplication.updateSpot(request.auth, params.id, body)),

      deleteSpot: async ({ params }, { request }: Platform) =>
        respond(await spotApplication.deleteSpot(request.auth, params.id)),

      rateSpot: async ({ params, body }, { request }: Platform) =>
        respond(await discoveryApplication.rateSpot(request.auth, params.id, body.rating)),

      getSpotRatingSummary: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.getSpotRatingSummary(request.auth, params.id)),

      removeSpotRating: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.removeSpotRating(request.auth, params.spotId)),

      getSpotsByIds: async ({ body }, { request }: Platform) =>
        respond(await spotApplication.getSpotsByIds(request.auth, body.ids)),
    },

    // ── Trails ───────────────────────────────────────────────────────────────
    trails: {
      listTrails: async ({ query }, { request }: Platform) =>
        respond(await trailApplication.listTrails(request.auth, toQueryOptions(query))),

      getTrail: async ({ params }, { request }: Platform) =>
        respond(await trailApplication.getTrail(request.auth, params.id)),

      createTrail: async ({ body }, { request }: Platform) => {
        const deny = requireRole(request.auth, CREATOR_ROLES)
        return deny ?? respond(await trailApplication.createTrail(request.auth, body))
      },

      updateTrail: async ({ params, body }, { request }: Platform) => {
        const deny = requireRole(request.auth, CREATOR_ROLES)
        return deny ?? respond(await trailApplication.updateTrail(request.auth, params.id, body))
      },

      deleteTrail: async ({ params }, { request }: Platform) => {
        const deny = requireRole(request.auth, CREATOR_ROLES)
        return deny ?? respond(await trailApplication.deleteTrail(request.auth, params.id))
      },

      getTrailSpots: async ({ params }, { request }: Platform) =>
        respond(await trailApplication.getTrailSpots(request.auth, params.trailId)),

      getTrailStats: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.getDiscoveryTrailStats(request.auth, params.trailId)),

      addSpotToTrail: async ({ params, body }, { request }: Platform) => {
        const deny = requireRole(request.auth, CREATOR_ROLES)
        return deny ?? respond(await trailApplication.addSpotToTrail(request.auth, params.trailId, body.spotId, body.order))
      },

      removeSpotFromTrail: async ({ params }, { request }: Platform) => {
        const deny = requireRole(request.auth, CREATOR_ROLES)
        return deny ?? respond(await trailApplication.removeSpotFromTrail(request.auth, params.trailId, params.spotId))
      },

      getTrailRatingSummary: async ({ params }, { request }: Platform) =>
        respond(await trailApplication.getTrailRatingSummary(request.auth, params.trailId)),

      rateTrail: async ({ params, body }, { request }: Platform) =>
        respond(await trailApplication.rateTrail(request.auth, params.trailId, body.rating)),

      removeTrailRating: async ({ params }, { request }: Platform) =>
        respond(await trailApplication.removeTrailRating(request.auth, params.trailId)),
    },

    // ── Discovery ────────────────────────────────────────────────────────────
    discovery: {
      processLocation: async ({ body }, { request }: Platform) =>
        respond(await discoveryApplication.processLocation(request.auth, body.locationWithDirection, body.trailId)),

      listDiscoveries: async ({ query }, { request }: Platform) =>
        respond(await discoveryApplication.getDiscoveries(request.auth, query?.trailId, toQueryOptions(query))),

      getDiscovery: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.getDiscovery(request.auth, params.id)),

      listDiscoveredSpots: async ({ query }, { request }: Platform) =>
        respond(await discoveryApplication.getDiscoveredSpots(request.auth, query?.trailId, toQueryOptions(query))),

      getDiscoveredPreviewClues: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.getDiscoveredPreviewClues(request.auth, params.trailId)),

      getDiscoveryTrail: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.getDiscoveryTrail(request.auth, params.trailId)),

      getDiscoveryProfile: async (_, { request }: Platform) =>
        respond(await discoveryApplication.getDiscoveryProfile(request.auth)),

      updateDiscoveryProfile: async ({ body }, { request }: Platform) =>
        respond(await discoveryApplication.updateDiscoveryProfile(request.auth, body)),

      getDiscoveryStats: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.getDiscoveryStats(request.auth, params.discoveryId)),

      getDiscoveryContent: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.getDiscoveryContent(request.auth, params.discoveryId)),

      upsertDiscoveryContent: async ({ params, body }, { request }: Platform) =>
        respond(await discoveryApplication.upsertDiscoveryContent(request.auth, params.discoveryId, body)),

      deleteDiscoveryContent: async ({ params }, { request }: Platform) =>
        respond(await discoveryApplication.deleteDiscoveryContent(request.auth, params.discoveryId)),

      createWelcomeDiscovery: async ({ body }, { request }: Platform) =>
        respond(await discoveryApplication.createWelcomeDiscovery(request.auth, body.location)),
    },

    // ── Account ──────────────────────────────────────────────────────────────
    account: {
      // Public routes: no auth check
      requestSMSCode: async ({ body }) =>
        respond(await accountApplication.requestSMSCode(body.phoneNumber)),

      verifySMSCode: async ({ body }) =>
        respond(await accountApplication.verifySMSCode(body.phoneNumber, body.code, body.client)),

      validateSession: async ({ body }) =>
        respond(await accountApplication.validateSession(body.sessionToken)),

      revokeSession: async ({ body }) =>
        respond(await accountApplication.revokeSession(body.sessionToken)),

      createLocalAccount: async () =>
        respond(await accountApplication.createLocalAccount()),

      // Authenticated routes
      getPublicProfile: async ({ params }, { request }: Platform) =>
        respond(await accountProfileComposite.getPublicProfile(request.auth, params.accountId)),

      getPublicProfiles: async ({ body }, { request }: Platform) =>
        respond(await accountProfileComposite.getPublicProfiles(request.auth, body.accountIds)),

      getAccountProfile: async (_, { request }: Platform) =>
        respond(await accountApplication.getAccount(request.auth)),

      updateAccountProfile: async ({ body }, { request }: Platform) =>
        respond(await accountApplication.updateAccount(request.auth, body)),

      uploadAvatar: async ({ body }, { request }: Platform) =>
        respond(await accountApplication.uploadAvatar(request.auth, body.base64Data)),

      upgradeToPhoneAccount: async ({ body }, { request }: Platform) =>
        respond(await accountApplication.upgradeToPhoneAccount(request.auth, body.phoneNumber, body.code)),

      getFirebaseConfig: async (_, { request }: Platform) =>
        respond(await accountApplication.getFirebaseConfig(request.auth)),

      registerDeviceToken: async ({ body }, { request }: Platform) =>
        respond(await accountApplication.registerDeviceToken(request.auth, body.token, body.platform)),

      removeDeviceToken: async ({ body }, { request }: Platform) =>
        respond(await accountApplication.removeDeviceToken(request.auth, body.token)),
    },

    // ── Sensor ───────────────────────────────────────────────────────────────
    sensor: {
      listScanEvents: async ({ query }, { request }: Platform) =>
        respond(await sensorApplication.listScanEvents(request.auth, query?.trailId)),

      createScanEvent: async ({ body }, { request }: Platform) =>
        respond(await sensorApplication.createScanEvent(request.auth, body?.userPosition, body?.trailId)),
    },

    // ── Community ────────────────────────────────────────────────────────────
    community: {
      createCommunity: async ({ body }, { request }: Platform) =>
        respond(await communityApplication.createCommunity(request.auth, { name: body.name, trailIds: body.trailIds ?? [] })),

      joinCommunity: async ({ body }, { request }: Platform) =>
        respond(await communityApplication.joinCommunity(request.auth, body.inviteCode)),

      listCommunities: async (_, { request }: Platform) =>
        respond(await communityApplication.listCommunities(request.auth)),

      getCommunity: async ({ params }, { request }: Platform) =>
        respond(await communityApplication.getCommunity(request.auth, params.communityId)),

      updateCommunity: async ({ params, body }, { request }: Platform) =>
        respond(await communityApplication.updateCommunity(request.auth, params.communityId, body)),

      leaveCommunity: async ({ params }, { request }: Platform) =>
        respond(await communityApplication.leaveCommunity(request.auth, params.communityId)),

      removeCommunity: async ({ params }, { request }: Platform) =>
        respond(await communityApplication.removeCommunity(request.auth, params.communityId)),

      listCommunityMembers: async ({ params }, { request }: Platform) =>
        respond(await communityApplication.listCommunityMembers(request.auth, params.communityId)),

      shareDiscovery: async ({ params }, { request }: Platform) =>
        respond(await communityApplication.shareDiscovery(request.auth, params.discoveryId, params.communityId)),

      unshareDiscovery: async ({ params }, { request }: Platform) =>
        respond(await communityApplication.unshareDiscovery(request.auth, params.discoveryId, params.communityId)),

      getSharedDiscoveries: async ({ params }, { request }: Platform) =>
        respond(await communityApplication.getSharedDiscoveries(request.auth, params.communityId)),
    },

    // ── Content ───────────────────────────────────────────────────────────────
    content: {
      getContentPage: async ({ params }) =>
        respond(await contentApplication.getPage(params.language, params.page)),

      listBlogPosts: async ({ params }) =>
        respond(await contentApplication.listBlogPosts(params.language)),

      getBlogPost: async ({ params }) =>
        respond(await contentApplication.getBlogPost(params.language, params.slug)),

      submitFeedback: async ({ body }) =>
        respond(await contentApplication.submitFeedback(body?.name, body?.email, body?.type, body?.message)),
    },

    // ── Composite ────────────────────────────────────────────────────────────
    composite: {
      getAccessibleSpots: async ({ query }, { request }: Platform) =>
        respond(await spotAccessComposite.getAccessibleSpots(request.auth, query?.trailId, toQueryOptions(query))),

      getDiscoveryState: async (_, { request }: Platform) =>
        respond(await discoveryStateComposite.getDiscoveryState(request.auth)),

      activateTrail: async ({ body }, { request }: Platform) =>
        respond(await discoveryStateComposite.activateTrail(request.auth, body.trailId)),
    },
    // ts-rest cannot infer the union return type of respond() per-route without this cast
  } as any)
}

// ── Handler Factory ───────────────────────────────────────────────────────────
export function createApiHandler(ctx: CoreContext, origins: string[]) {
  const router = createApiRouter(ctx)

  return createFetchHandler(apiContract, router, {
    basePath: '/core/api/v1',
    cors: {
      origin: origins.length > 0 ? origins : '*',
      credentials: true,
    },
    errorHandler: async (error: unknown) => {
      logger.error('[router] Unhandled error in route handler:', error instanceof Error ? error.stack : error)
      return undefined // let ts-rest return the default 500
    },
    requestMiddleware: [
      // Validate Bearer token and attach auth context to every request
      async (request: Request & { auth: AuthContext }) => {
        const authHeader = request.headers.get('Authorization') as string | null
        if (!authHeader?.startsWith('Bearer ')) {
          request.auth = PUBLIC_AUTH
          return
        }
        const token = authHeader.slice(7)
        try {
          const result = await ctx.accountApplication.validateSession(token)
          if (result.success && result.data?.valid) {
            request.auth = {
              accountId: result.data.accountId,
              accountType: result.data.accountType ?? 'sms_verified',
              role: result.data.role ?? 'user',
              client: result.data.client,
            }
          } else {
            request.auth = PUBLIC_AUTH
          }
        } catch (err) {
          logger.error('Auth middleware error', err)
          request.auth = PUBLIC_AUTH
        }
      },
    ],
    responseHandlers: [
      (response, request) => {
        const start = (request as Request & { _startTime?: number })._startTime
        if (start) {
          logger.info(`${request.method} ${new URL(request.url).pathname} ${response.status} (${Date.now() - start}ms)`)
        }
      },
    ],
  })
}

/**
 * oRPC API Router
 * Implements all procedure handlers using the typed contract.
 *
 * Auth model:
 *  - Bearer token resolved before oRPC handler runs → attached as `request.auth`
 *  - Procedures access auth via `context.request.auth`
 *  - Public routes use PUBLIC_AUTH fallback
 */

import { manifest } from '@core/api/manifest.ts'
import type { CoreContext } from '@core/core.ts'
import { logger } from '@core/shared/logger.ts'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { ORPCError, implement, onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { CORSPlugin } from '@orpc/server/plugins'
import { ERROR_CODES } from '@shared/contracts/errors.ts'
import type { QueryOptions, Result } from '@shared/contracts/results.ts'
import { apiContract } from '@shared/orpc/contract.ts'

// ── Auth ──────────────────────────────────────────────────────────────────────

interface AuthContext {
  accountId: string
  accountType: 'sms_verified' | 'local_unverified' | 'public'
  role: 'user' | 'creator' | 'admin'
  client?: 'app' | 'creator'
}

const PUBLIC_AUTH: AuthContext = { accountId: 'public', accountType: 'public', role: 'user' }

interface InitialContext {
  request: Request & { auth: AuthContext }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toQueryOptions(input?: Record<string, any>): QueryOptions | undefined {
  if (!input) return undefined
  const opts: QueryOptions = {}
  if (input.limit != null) opts.limit = input.limit
  if (input.orderBy) opts.sortBy = input.orderBy
  if (input.createdBy) opts.filters = { createdBy: input.createdBy }
  if (input.trailId) opts.filters = { ...opts.filters as object, trailId: input.trailId }
  return Object.keys(opts).length > 0 ? opts : undefined
}

// Unwraps a Result<T>, throwing ORPCError on failure.
function unwrap<T>(result: Result<T>): T {
  if (result.success) return result.data as T
  const errorDef = ERROR_CODES[result.error!.code as keyof typeof ERROR_CODES]
  throw new ORPCError(result.error!.code as any, {
    status: errorDef?.httpStatus ?? 500,
    message: result.error!.message,
  })
}

const CREATOR_ROLES: AuthContext['role'][] = ['creator', 'admin']

function requireRole(auth: AuthContext, allowed: AuthContext['role'][]) {
  if (!allowed.includes(auth.role)) {
    throw new ORPCError('UNAUTHORIZED', { status: 403, message: 'Insufficient role' })
  }
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

  const os = implement(apiContract).$context<InitialContext>()
  const auth = (context: InitialContext) => context.request.auth

  return os.router({

    // ── System (public) ──────────────────────────────────────────────────────
    system: {
      getManifest: os.system.getManifest.handler(() => manifest),
      getStatus: os.system.getStatus.handler(() => ({ status: 'ok', message: 'Ferthe Core API is running' })),
    },

    // ── Spots ────────────────────────────────────────────────────────────────
    spots: {
      list: os.spots.list.handler(async ({ input, context }) => ({
        items: unwrap(await spotApplication.getSpots(auth(context), toQueryOptions(input))),
        nextCursor: undefined,
      })),

      listPreviews: os.spots.listPreviews.handler(async ({ input, context }) => {
        const items = input?.ids
          ? unwrap(await spotApplication.getSpotPreviewsByIds(auth(context), input.ids.split(',')))
          : unwrap(await spotApplication.getSpotPreviews(toQueryOptions(input)))
        return { items, nextCursor: undefined }
      }),

      get: os.spots.get.handler(async ({ input, context }) =>
        unwrap(await spotAccessComposite.getAccessibleSpot(auth(context), input.id)) as any),

      create: os.spots.create.handler(async ({ input, context }) =>
        unwrap(await spotApplication.createSpot(auth(context), input))),

      update: os.spots.update.handler(async ({ input, context }) => {
        const { id, ...body } = input as any
        return unwrap(await spotApplication.updateSpot(auth(context), id, body))
      }),

      delete: os.spots.delete.handler(async ({ input, context }) =>
        unwrap(await spotApplication.deleteSpot(auth(context), input.id))),

      rate: os.spots.rate.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.rateSpot(auth(context), input.id, input.rating))),

      getRatingSummary: os.spots.getRatingSummary.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.getSpotRatingSummary(auth(context), input.id))),

      removeRating: os.spots.removeRating.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.removeSpotRating(auth(context), input.spotId))),

      getByIds: os.spots.getByIds.handler(async ({ input, context }) =>
        unwrap(await spotApplication.getSpotsByIds(auth(context), input.ids))),
    },

    // ── Trails ───────────────────────────────────────────────────────────────
    trails: {
      list: os.trails.list.handler(async ({ input, context }) => ({
        items: unwrap(await trailApplication.listTrails(auth(context), toQueryOptions(input))),
        nextCursor: undefined,
      })),

      get: os.trails.get.handler(async ({ input, context }) =>
        unwrap(await trailApplication.getTrail(auth(context), input.id))),

      create: os.trails.create.handler(async ({ input, context }) => {
        requireRole(auth(context), CREATOR_ROLES)
        return unwrap(await trailApplication.createTrail(auth(context), input))
      }),

      update: os.trails.update.handler(async ({ input, context }) => {
        requireRole(auth(context), CREATOR_ROLES)
        const { id, ...body } = input as any
        return unwrap(await trailApplication.updateTrail(auth(context), id, body))
      }),

      delete: os.trails.delete.handler(async ({ input, context }) => {
        requireRole(auth(context), CREATOR_ROLES)
        return unwrap(await trailApplication.deleteTrail(auth(context), input.id))
      }),

      listSpots: os.trails.listSpots.handler(async ({ input, context }) => ({
        items: unwrap(await trailApplication.getTrailSpots(auth(context), input.trailId)),
        nextCursor: undefined,
      })),

      getStats: os.trails.getStats.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.getDiscoveryTrailStats(auth(context), input.trailId))),

      addSpot: os.trails.addSpot.handler(async ({ input, context }) => {
        requireRole(auth(context), CREATOR_ROLES)
        return unwrap(await trailApplication.addSpotToTrail(auth(context), input.trailId, input.spotId, input.order))
      }),

      removeSpot: os.trails.removeSpot.handler(async ({ input, context }) => {
        requireRole(auth(context), CREATOR_ROLES)
        return unwrap(await trailApplication.removeSpotFromTrail(auth(context), input.trailId, input.spotId))
      }),

      getRatingSummary: os.trails.getRatingSummary.handler(async ({ input, context }) =>
        unwrap(await trailApplication.getTrailRatingSummary(auth(context), input.trailId))),

      rate: os.trails.rate.handler(async ({ input, context }) =>
        unwrap(await trailApplication.rateTrail(auth(context), input.trailId, input.rating))),

      removeRating: os.trails.removeRating.handler(async ({ input, context }) =>
        unwrap(await trailApplication.removeTrailRating(auth(context), input.trailId))),
    },

    // ── Discovery ────────────────────────────────────────────────────────────
    discovery: {
      processLocation: os.discovery.processLocation.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.processLocation(auth(context), input.locationWithDirection, input.trailId))),

      list: os.discovery.list.handler(async ({ input, context }) => ({
        items: unwrap(await discoveryApplication.getDiscoveries(auth(context), input?.trailId, toQueryOptions(input))),
        nextCursor: undefined,
      })),

      get: os.discovery.get.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.getDiscovery(auth(context), input.id))),

      listSpots: os.discovery.listSpots.handler(async ({ input, context }) => ({
        items: unwrap(await discoveryApplication.getDiscoveredSpots(auth(context), input?.trailId, toQueryOptions(input))),
        nextCursor: undefined,
      })),

      listPreviewClues: os.discovery.listPreviewClues.handler(async ({ input, context }) => ({
        items: unwrap(await discoveryApplication.getDiscoveredPreviewClues(auth(context), input.trailId)),
        nextCursor: undefined,
      })),

      getTrail: os.discovery.getTrail.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.getDiscoveryTrail(auth(context), input.trailId))),

      getProfile: os.discovery.getProfile.handler(async ({ context }) =>
        unwrap(await discoveryApplication.getDiscoveryProfile(auth(context)))),

      updateProfile: os.discovery.updateProfile.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.updateDiscoveryProfile(auth(context), input))),

      getStats: os.discovery.getStats.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.getDiscoveryStats(auth(context), input.discoveryId))),

      getContent: os.discovery.getContent.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.getDiscoveryContent(auth(context), input.discoveryId))),

      upsertContent: os.discovery.upsertContent.handler(async ({ input, context }) => {
        const { discoveryId, ...body } = input as any
        return unwrap(await discoveryApplication.upsertDiscoveryContent(auth(context), discoveryId, body))
      }),

      deleteContent: os.discovery.deleteContent.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.deleteDiscoveryContent(auth(context), input.discoveryId))),

      createWelcome: os.discovery.createWelcome.handler(async ({ input, context }) =>
        unwrap(await discoveryApplication.createWelcomeDiscovery(auth(context), input.location))),
    },

    // ── Account ──────────────────────────────────────────────────────────────
    account: {
      requestSMSCode: os.account.requestSMSCode.handler(async ({ input }) =>
        unwrap(await accountApplication.requestSMSCode(input.phoneNumber))),

      verifySMSCode: os.account.verifySMSCode.handler(async ({ input }) =>
        unwrap(await accountApplication.verifySMSCode(input.phoneNumber, input.code, input.client))),

      getPublicProfile: os.account.getPublicProfile.handler(async ({ input, context }) =>
        unwrap(await accountProfileComposite.getPublicProfile(auth(context), input.accountId))),

      getPublicProfiles: os.account.getPublicProfiles.handler(async ({ input, context }) =>
        unwrap(await accountProfileComposite.getPublicProfiles(auth(context), input.accountIds))),

      getProfile: os.account.getProfile.handler(async ({ context }) =>
        unwrap(await accountApplication.getAccount(auth(context)))),

      updateProfile: os.account.updateProfile.handler(async ({ input, context }) =>
        unwrap(await accountApplication.updateAccount(auth(context), input))),

      uploadAvatar: os.account.uploadAvatar.handler(async ({ input, context }) =>
        unwrap(await accountApplication.uploadAvatar(auth(context), input.base64Data))),

      validateSession: os.account.validateSession.handler(async ({ input }) =>
        unwrap(await accountApplication.validateSession(input.sessionToken))),

      revokeSession: os.account.revokeSession.handler(async ({ input }) =>
        unwrap(await accountApplication.revokeSession(input.sessionToken))),

      createLocalAccount: os.account.createLocalAccount.handler(async () =>
        unwrap(await accountApplication.createLocalAccount())),

      upgradeToPhoneAccount: os.account.upgradeToPhoneAccount.handler(async ({ input, context }) =>
        unwrap(await accountApplication.upgradeToPhoneAccount(auth(context), input.phoneNumber, input.code))),

      getFirebaseConfig: os.account.getFirebaseConfig.handler(async ({ context }) =>
        unwrap(await accountApplication.getFirebaseConfig(auth(context)))),

      registerDeviceToken: os.account.registerDeviceToken.handler(async ({ input, context }) =>
        unwrap(await accountApplication.registerDeviceToken(auth(context), input.token, input.platform as any))),

      removeDeviceToken: os.account.removeDeviceToken.handler(async ({ input, context }) =>
        unwrap(await accountApplication.removeDeviceToken(auth(context), input.token))),
    },

    // ── Sensor ───────────────────────────────────────────────────────────────
    sensor: {
      listScans: os.sensor.listScans.handler(async ({ input, context }) => ({
        items: unwrap(await sensorApplication.listScanEvents(auth(context), input?.trailId as any)),
        nextCursor: undefined,
      })),

      createScan: os.sensor.createScan.handler(async ({ input, context }) =>
        unwrap(await sensorApplication.createScanEvent(auth(context), input?.userPosition, input?.trailId))),
    },

    // ── Community ────────────────────────────────────────────────────────────
    community: {
      create: os.community.create.handler(async ({ input, context }) =>
        unwrap(await communityApplication.createCommunity(auth(context), { name: input.name, trailIds: input.trailIds ?? [] }))),

      join: os.community.join.handler(async ({ input, context }) =>
        unwrap(await communityApplication.joinCommunity(auth(context), input.inviteCode))),

      list: os.community.list.handler(async ({ context }) => ({
        items: unwrap(await communityApplication.listCommunities(auth(context))),
        nextCursor: undefined,
      })),

      get: os.community.get.handler(async ({ input, context }) =>
        unwrap(await communityApplication.getCommunity(auth(context), input.communityId))),

      update: os.community.update.handler(async ({ input, context }) => {
        const { communityId, ...body } = input
        return unwrap(await communityApplication.updateCommunity(auth(context), communityId, body))
      }),

      leave: os.community.leave.handler(async ({ input, context }) =>
        unwrap(await communityApplication.leaveCommunity(auth(context), input.communityId))),

      delete: os.community.delete.handler(async ({ input, context }) =>
        unwrap(await communityApplication.removeCommunity(auth(context), input.communityId))),

      listMembers: os.community.listMembers.handler(async ({ input, context }) => ({
        items: unwrap(await communityApplication.listCommunityMembers(auth(context), input.communityId)),
        nextCursor: undefined,
      })),

      shareDiscovery: os.community.shareDiscovery.handler(async ({ input, context }) =>
        unwrap(await communityApplication.shareDiscovery(auth(context), input.discoveryId, input.communityId))),

      unshareDiscovery: os.community.unshareDiscovery.handler(async ({ input, context }) =>
        unwrap(await communityApplication.unshareDiscovery(auth(context), input.discoveryId, input.communityId))),

      listSharedDiscoveries: os.community.listSharedDiscoveries.handler(async ({ input, context }) => ({
        items: unwrap(await communityApplication.getSharedDiscoveries(auth(context), input.communityId)),
        nextCursor: undefined,
      })),
    },

    // ── Content ───────────────────────────────────────────────────────────────
    content: {
      getPage: os.content.getPage.handler(async ({ input }) =>
        unwrap(await contentApplication.getPage(input.language, input.page))),

      listBlogPosts: os.content.listBlogPosts.handler(async ({ input }) => ({
        items: unwrap(await contentApplication.listBlogPosts(input.language)),
        nextCursor: undefined,
      })),

      getBlogPost: os.content.getBlogPost.handler(async ({ input }) =>
        unwrap(await contentApplication.getBlogPost(input.language, input.slug))),

      submitFeedback: os.content.submitFeedback.handler(async ({ input }) => {
        unwrap(await contentApplication.submitFeedback(input?.name, input?.email, input?.type, input?.message))
        return { received: true as const }
      }),
    },

    // ── Composite ────────────────────────────────────────────────────────────
    composite: {
      listAccessibleSpots: os.composite.listAccessibleSpots.handler(async ({ input, context }) => ({
        items: unwrap(await spotAccessComposite.getAccessibleSpots(auth(context), input?.trailId, toQueryOptions(input))),
        nextCursor: undefined,
      })),

      getDiscoveryState: os.composite.getDiscoveryState.handler(async ({ context }) =>
        unwrap(await discoveryStateComposite.getDiscoveryState(auth(context)))),

      activateTrail: os.composite.activateTrail.handler(async ({ input, context }) =>
        unwrap(await discoveryStateComposite.activateTrail(auth(context), input.trailId))),
    },
  })
}

// ── Handler Factory ───────────────────────────────────────────────────────────

export function createApiHandler(ctx: CoreContext, origins: string[]) {
  const router = createApiRouter(ctx)

  const corsPlugin = new CORSPlugin({
    origin: origins.length > 0 ? origins : '*',
    credentials: true,
  })

  // deno-lint-ignore no-explicit-any
  const errorInterceptor: any = onError((error) => {
    logger.error('[router] Validation error:', JSON.stringify(error, null, 2))

    const issues = (error as any)?.data?.issues ?? (error as any)?.cause?.issues
    if (issues) {
      logger.error('[router] Validation error:', JSON.stringify(issues, null, 2))
    } else {
      logger.error('[router] Unhandled error in route handler:', error instanceof Error ? error.stack : error)
    }
  })

  const rpcHandler = new RPCHandler(router, {
    plugins: [corsPlugin],
    interceptors: [errorInterceptor],
  })

  const openApiHandler = new OpenAPIHandler(router, {
    plugins: [corsPlugin],
    interceptors: [errorInterceptor],
  })

  return async (request: Request): Promise<Response> => {
    // Resolve auth and attach to request before passing to oRPC
    const authHeader = request.headers.get('Authorization')
    const authedRequest = request as Request & { auth: AuthContext }

    if (!authHeader?.startsWith('Bearer ')) {
      authedRequest.auth = PUBLIC_AUTH
    } else {
      const token = authHeader.slice(7)
      try {
        const result = await ctx.accountApplication.validateSession(token)
        if (result.success && result.data?.valid) {
          authedRequest.auth = {
            accountId: result.data.accountId,
            accountType: result.data.accountType ?? 'sms_verified',
            role: result.data.role ?? 'user',
            client: result.data.client,
          }
        } else {
          authedRequest.auth = PUBLIC_AUTH
        }
      } catch (err) {
        logger.error('Auth middleware error', err)
        authedRequest.auth = PUBLIC_AUTH
      }
    }

    const rpcResult = await rpcHandler.handle(authedRequest, {
      prefix: '/core/api/v1/rpc',
      context: { request: authedRequest },
    })
    if (rpcResult.matched) return rpcResult.response

    const openApiResult = await openApiHandler.handle(authedRequest, {
      prefix: '/core/api/v1',
      context: { request: authedRequest },
    })
    if (openApiResult.matched) return openApiResult.response

    return new Response('Not found', { status: 404 })
  }
}

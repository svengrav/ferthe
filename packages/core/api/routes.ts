import { parseQueryOptions } from '@core/api/oak/queryOptions.ts'
import { createAsyncRequestHandler } from '@core/api/oak/requestHandler.ts'

import {
  Account,
  ActivateTrailResult,
  APIContract,
  Clue,
  Community,
  CommunityMember,
  CreateSpotRequest,
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
  SpotRating,
  StoredTrailSpot,
  Trail,
  TrailRating,
  TrailSpot,
  TrailStats,
  UpdateSpotRequest
} from '@shared/contracts/index.ts'
import { manifest } from './manifest.ts'
import { Route } from './oak/types.ts'

const createRoutes = (ctx: APIContract): Route[] => {
  const { discoveryApplication, sensorApplication, trailApplication, spotApplication, accountApplication, communityApplication, spotAccessComposite, discoveryStateComposite } = ctx

  // Create the request handler with account application access
  const asyncRequestHandler = createAsyncRequestHandler(accountApplication)

  return [
    {
      method: 'GET',
      version: 'v1',
      url: '/',
      config: { isPublic: true },
      // deno-lint-ignore require-await
      handler: asyncRequestHandler(async () => {
        return {
          success: true,
          data: manifest,
        }
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/status',
      config: { isPublic: true },
      // deno-lint-ignore require-await
      handler: asyncRequestHandler(async () => {
        return {
          success: true,
          status: 'ok',
          message: 'Ferthe Core API is running',
        }
      }),
    },

    // Discovery API Routes (Authenticated)
    {
      method: 'POST',
      version: 'v1',
      url: '/discovery/actions/process-location',
      handler: asyncRequestHandler<DiscoveryLocationRecord>(async ({ context: session, body }) => {
        return await discoveryApplication.processLocation(session, body?.locationWithDirection, body?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/discoveries',
      handler: asyncRequestHandler<Discovery[]>(async ({ context: session, query }) => {
        return await discoveryApplication.getDiscoveries(session, query?.trailId, parseQueryOptions(query))
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/spots',
      handler: asyncRequestHandler<DiscoverySpot[]>(async ({ context: session, query }) => {
        return await discoveryApplication.getDiscoveredSpots(session, query?.trailId, parseQueryOptions(query))
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/trails/:trailId/clues',
      handler: asyncRequestHandler<Clue[], { trailId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveredPreviewClues(session, params!.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/trails/:trailId',
      handler: asyncRequestHandler<DiscoveryTrail, { trailId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveryTrail(session, params!.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/profile',
      handler: asyncRequestHandler<DiscoveryProfile>(async ({ context: session }) => {
        return await discoveryApplication.getDiscoveryProfile(session)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/discoveries/:discoveryId/stats',
      handler: asyncRequestHandler<DiscoveryStats, { discoveryId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveryStats(session, params!.discoveryId)
      }),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/discovery/profile',
      handler: asyncRequestHandler<DiscoveryProfile>(async ({ context: session, body }) => {
        return await discoveryApplication.updateDiscoveryProfile(session, body)
      }),
    },

    // Discovery Content Routes
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/discoveries/:discoveryId/content',
      handler: asyncRequestHandler<DiscoveryContent | undefined, { discoveryId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveryContent(session, params!.discoveryId)
      }),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/discovery/discoveries/:discoveryId/content',
      handler: asyncRequestHandler<DiscoveryContent, { discoveryId: string }>(async ({ context: session, params, body }) => {
        return await discoveryApplication.upsertDiscoveryContent(session, params!.discoveryId, body)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/discovery/discoveries/:discoveryId/content',
      handler: asyncRequestHandler<void, { discoveryId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.deleteDiscoveryContent(session, params!.discoveryId)
      }),
    },

    // Spot Rating Routes
    {
      method: 'GET',
      version: 'v1',
      url: '/spot/spots/:spotId/ratings',
      handler: asyncRequestHandler<RatingSummary, { spotId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getSpotRatingSummary(session, params!.spotId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/spot/spots/:spotId/ratings',
      handler: asyncRequestHandler<SpotRating, { spotId: string }>(async ({ context: session, params, body }) => {
        return await discoveryApplication.rateSpot(session, params!.spotId, body.rating)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/spot/spots/:spotId/ratings',
      handler: asyncRequestHandler<void, { spotId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.removeSpotRating(session, params!.spotId)
      }),
    },

    // Trail Rating Routes
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/trails/:trailId/ratings',
      handler: asyncRequestHandler<RatingSummary, { trailId: string }>(async ({ context: session, params }) => {
        return await trailApplication.getTrailRatingSummary(session, params!.trailId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/trail/trails/:trailId/ratings',
      handler: asyncRequestHandler<TrailRating, { trailId: string }>(async ({ context: session, params, body }) => {
        return await trailApplication.rateTrail(session, params!.trailId, body.rating)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/trail/trails/:trailId/ratings',
      handler: asyncRequestHandler<void, { trailId: string }>(async ({ context: session, params }) => {
        return await trailApplication.removeTrailRating(session, params!.trailId)
      }),
    },

    // Trail API Routes (Authenticated)
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/trails',
      handler: asyncRequestHandler<Trail[]>(async ({ context, query }) => {
        return await trailApplication.listTrails(context, parseQueryOptions(query))
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/trails/:id',
      handler: asyncRequestHandler<Trail | undefined, { id: string }, never>(async ({ params, context }) => {
        return await trailApplication.getTrail(context, params!.id)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/trails/:trailId/spots',
      handler: asyncRequestHandler<TrailSpot[]>(async ({ context, params }) => {
        return await trailApplication.getTrailSpots(context, params!.trailId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/spot/spots',
      handler: asyncRequestHandler<Spot, never, CreateSpotRequest>(async ({ context, body }) => {
        return await spotApplication.createSpot(context, body!)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/spot/spots/:id',
      // TODO: Enhanced access control implementation recommended
      // Currently allows authenticated access. Consider adding:
      // - Ownership check (spot.createdBy === context.accountId)
      // - Admin role verification
      // - Discovery verification (check if user discovered the spot)
      handler: asyncRequestHandler<Spot | undefined, { id: string }, never>(async ({ params, context }) => {
        return await spotApplication.getSpot(context, params!.id)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/spot/spots/:id',
      handler: asyncRequestHandler<void, { id: string }, never>(async ({ params, context }) => {
        return await spotApplication.deleteSpot(context, params!.id)
      }),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/spot/spots/:id',
      handler: asyncRequestHandler<Spot, { id: string }, UpdateSpotRequest>(async ({ params, context, body }) => {
        return await spotApplication.updateSpot(context, params!.id, body!)
      }),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/spot/spots/:id',
      handler: asyncRequestHandler<Spot, { id: string }, UpdateSpotRequest>(async ({ params, context, body }) => {
        return await spotApplication.updateSpot(context, params!.id, body!)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/trails/:trailId/stats',
      handler: asyncRequestHandler<TrailStats, { trailId: string }>(async ({ context, params }) => {
        return await discoveryApplication.getDiscoveryTrailStats(context, params!.trailId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/trail/trails/:trailId/spots/:spotId',
      handler: asyncRequestHandler<StoredTrailSpot, { trailId: string; spotId: string }, { order?: number }>(async ({ params, context, body }) => {
        return await trailApplication.addSpotToTrail(context, params!.trailId, params!.spotId, body?.order)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/trail/trails/:trailId/spots/:spotId',
      handler: asyncRequestHandler<void, { trailId: string; spotId: string }, never>(async ({ params, context }) => {
        return await trailApplication.removeSpotFromTrail(context, params!.trailId, params!.spotId)
      }),
    },

    // Sensor API Routes (Authenticated)
    {
      method: 'GET',
      version: 'v1',
      url: '/sensor/scans',
      handler: asyncRequestHandler(async ({ context, query }) => {
        return await sensorApplication.listScanEvents(context, query?.trailId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/sensor/scans',
      handler: asyncRequestHandler<ScanEvent>(async ({ context: session, body }) => {
        return await sensorApplication.createScanEvent(session, body?.userPosition, body?.trailId)
      }),
    },

    // Account API Routes (Mixed authentication requirements)
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/request-sms',
      config: { isPublic: true },
      handler: asyncRequestHandler<SMSCodeRequest>(async ({ body }) => {
        return await accountApplication.requestSMSCode(body?.phoneNumber)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/verify-sms',
      config: { isPublic: true },
      handler: asyncRequestHandler<SMSVerificationResult>(async ({ body }) => {
        return await accountApplication.verifySMSCode(body?.phoneNumber, body?.code)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/profile',
      handler: asyncRequestHandler<Account | null>(async ({ context }) => {
        return await accountApplication.getAccount(context)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/profile/:accountId',
      handler: asyncRequestHandler<Account | null, { accountId: string }, never>(async ({ context }) => {
        return await accountApplication.getAccount(context)
      }),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/account/profile',
      handler: asyncRequestHandler<Account>(async ({ context, body }) => {
        return await accountApplication.updateAccount(context, body)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/profile/avatar',
      handler: asyncRequestHandler<Account>(async ({ context, body }) => {
        return await accountApplication.uploadAvatar(context, body?.base64Data)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/validate-session',
      config: { isPublic: true },
      handler: asyncRequestHandler(async ({ body }) => {
        return await accountApplication.validateSession(body?.sessionToken)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/revoke-session',
      config: { isPublic: true },
      handler: asyncRequestHandler(async ({ body }) => {
        return await accountApplication.revokeSession(body?.sessionToken)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/create-local',
      config: { isPublic: true },
      handler: asyncRequestHandler(async () => {
        return await accountApplication.createLocalAccount()
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/upgrade-to-phone',
      handler: asyncRequestHandler(async ({ context, body }) => {
        return await accountApplication.upgradeToPhoneAccount(context, body?.phoneNumber, body?.code)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/config/firebase',
      handler: asyncRequestHandler<FirebaseConfig>(async ({ context }) => {
        return await accountApplication.getFirebaseConfig(context)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/communities',
      handler: asyncRequestHandler<Community>(async ({ context, body }) => {
        return await communityApplication.createCommunity(context, { name: body?.name || '', trailIds: body?.trailIds || [] })
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/actions/join',
      handler: asyncRequestHandler<Community>(async ({ context, body }) => {
        return await communityApplication.joinCommunity(context, body?.inviteCode)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/communities',
      handler: asyncRequestHandler<Community[]>(async ({ context }) => {
        return await communityApplication.listCommunities(context)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/communities/:communityId',
      handler: asyncRequestHandler<Community | undefined, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.getCommunity(context, params!.communityId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/communities/:communityId/actions/leave',
      handler: asyncRequestHandler<void, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.leaveCommunity(context, params!.communityId)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/community/communities/:communityId',
      handler: asyncRequestHandler<void, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.removeCommunity(context, params!.communityId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/communities/:communityId/members',
      handler: asyncRequestHandler<CommunityMember[], { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.listCommunityMembers(context, params!.communityId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/communities/:communityId/discoveries/:discoveryId/share',
      handler: asyncRequestHandler<SharedDiscovery, { communityId: string; discoveryId: string }>(async ({ context, params }) => {
        return await communityApplication.shareDiscovery(context, params!.discoveryId, params!.communityId)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/community/communities/:communityId/discoveries/:discoveryId/share',
      handler: asyncRequestHandler<void, { communityId: string; discoveryId: string }>(async ({ context, params }) => {
        return await communityApplication.unshareDiscovery(context, params!.discoveryId, params!.communityId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/communities/:communityId/discoveries',
      handler: asyncRequestHandler<Discovery[], { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.getSharedDiscoveries(context, params!.communityId)
      }),
    },

    // ── Composite Routes ─────────────────────────────────────────

    {
      method: 'GET',
      version: 'v1',
      url: '/composite/spots/accessible',
      handler: asyncRequestHandler<Spot[]>(async ({ context, query }) => {
        const options = parseQueryOptions(query)
        const trailId = query?.trailId as string | undefined
        return await spotAccessComposite.getAccessibleSpots(context, trailId, options)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/composite/discovery/state',
      handler: asyncRequestHandler<DiscoveryState>(async ({ context }) => {
        return await discoveryStateComposite.getDiscoveryState(context)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/composite/discovery/actions/activate-trail',
      handler: asyncRequestHandler<ActivateTrailResult>(async ({ context, body }) => {
        const { trailId } = body as { trailId: string }
        return await discoveryStateComposite.activateTrail(context, trailId)
      }),
    },
  ]
}
export default createRoutes


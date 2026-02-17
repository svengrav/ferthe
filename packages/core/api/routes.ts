import { createAsyncRequestHandler } from '@core/api/oak/requestHandler.ts'

import {
  Account,
  ApplicationContract,
  Clue,
  Community,
  CommunityMember,
  Discovery,
  DiscoveryContent,
  DiscoveryLocationRecord,
  DiscoveryProfile,
  DiscoverySpot,
  DiscoveryStats,
  DiscoveryTrail,
  FirebaseConfig,
  RatingSummary,
  SMSCodeRequest,
  SMSVerificationResult,
  ScanEvent,
  SharedDiscovery,
  Spot,
  SpotPreview,
  SpotRating,
  Trail,
  TrailRating,
  TrailSpot,
  TrailStats,
} from '@shared/contracts/index.ts'
import { manifest } from './manifest.ts'
import { Route } from './oak/types.ts'

const createRoutes = (ctx: ApplicationContract): Route[] => {
  const { discoveryApplication, sensorApplication, trailApplication, accountApplication, communityApplication } = ctx

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
      url: '/discoveries/process',
      handler: asyncRequestHandler<DiscoveryLocationRecord>(async ({ context: session, body }) => {
        return await discoveryApplication.processLocation(session, body?.locationWithDirection, body?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/collections/discoveries',
      handler: asyncRequestHandler<Discovery[]>(async ({ context: session, query }) => {
        return await discoveryApplication.getDiscoveries(session, query?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/collections/spots',
      handler: asyncRequestHandler<DiscoverySpot[]>(async ({ context: session, query }) => {
        return await discoveryApplication.getDiscoveredSpots(session, query?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/collections/trails/:trailId/clues',
      handler: asyncRequestHandler<Clue[], { trailId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveredPreviewClues(session, params!.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/collections/trails/:trailId',
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
      url: '/discoveries/:discoveryId/stats',
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
      url: '/discoveries/:discoveryId/content',
      handler: asyncRequestHandler<DiscoveryContent | undefined, { discoveryId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveryContent(session, params!.discoveryId)
      }),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/discoveries/:discoveryId/content',
      handler: asyncRequestHandler<DiscoveryContent, { discoveryId: string }>(async ({ context: session, params, body }) => {
        return await discoveryApplication.upsertDiscoveryContent(session, params!.discoveryId, body)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/discoveries/:discoveryId/content',
      handler: asyncRequestHandler<void, { discoveryId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.deleteDiscoveryContent(session, params!.discoveryId)
      }),
    },

    // Spot Rating Routes
    {
      method: 'GET',
      version: 'v1',
      url: '/spots/:spotId/ratings',
      handler: asyncRequestHandler<RatingSummary, { spotId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getSpotRatingSummary(session, params!.spotId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/spots/:spotId/ratings',
      handler: asyncRequestHandler<SpotRating, { spotId: string }>(async ({ context: session, params, body }) => {
        return await discoveryApplication.rateSpot(session, params!.spotId, body.rating)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/spots/:spotId/ratings',
      handler: asyncRequestHandler<void, { spotId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.removeSpotRating(session, params!.spotId)
      }),
    },

    // Trail Rating Routes
    {
      method: 'GET',
      version: 'v1',
      url: '/trails/:trailId/ratings',
      handler: asyncRequestHandler<RatingSummary, { trailId: string }>(async ({ context: session, params }) => {
        return await trailApplication.getTrailRatingSummary(session, params!.trailId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/trails/:trailId/ratings',
      handler: asyncRequestHandler<TrailRating, { trailId: string }>(async ({ context: session, params, body }) => {
        return await trailApplication.rateTrail(session, params!.trailId, body.rating)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/trails/:trailId/ratings',
      handler: asyncRequestHandler<void, { trailId: string }>(async ({ context: session, params }) => {
        return await trailApplication.removeTrailRating(session, params!.trailId)
      }),
    },

    // Trail API Routes (Authenticated)
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/trails',
      handler: asyncRequestHandler<Trail[]>(async ({ context }) => {
        return await trailApplication.listTrails(context)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/trails/:id',
      handler: asyncRequestHandler<Trail | undefined, { id: string }, never>(async ({ params, context }) => {
        return await trailApplication.getTrail(context, params!.id)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/spots',
      handler: asyncRequestHandler<Spot[]>(async ({ context, query }) => {
        return await trailApplication.listSpots(context, query?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/spot-previews',
      handler: asyncRequestHandler<SpotPreview[]>(async ({ context, query }) => {
        return await trailApplication.listSpotPreviews(context, query?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/spots/:id',
      handler: asyncRequestHandler<Spot | undefined, { id: string }, never>(async ({ params, context }) => {
        return await trailApplication.getSpot(context, params!.id)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trails/:trailId/stats',
      handler: asyncRequestHandler<TrailStats, { trailId: string }>(async ({ context, params }) => {
        return await trailApplication.getTrailStats(context, params!.trailId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/trail/:trailId/spots/:spotId',
      handler: asyncRequestHandler<TrailSpot, { trailId: string; spotId: string }, { order?: number }>(async ({ params, context, body }) => {
        return await trailApplication.addSpotToTrail(context, params!.trailId, params!.spotId, body?.order)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/trail/:trailId/spots/:spotId',
      handler: asyncRequestHandler<void, { trailId: string; spotId: string }, never>(async ({ params, context }) => {
        return await trailApplication.removeSpotFromTrail(context, params!.trailId, params!.spotId)
      }),
    },

    // Sensor API Routes (Authenticated)
    {
      method: 'GET',
      version: 'v1',
      url: '/sensor/collections/scans',
      handler: asyncRequestHandler(async ({ context, query }) => {
        return await sensorApplication.listScanEvents(context, query?.trailId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/sensor/collections/scans',
      handler: asyncRequestHandler<ScanEvent>(async ({ context: session, body }) => {
        return await sensorApplication.createScanEvent(session, body?.userPosition, body?.trailId)
      }),
    },

    // Account API Routes (Mixed authentication requirements)
    {
      method: 'POST',
      version: 'v1',
      url: '/account/sms/request',
      config: { isPublic: true },
      handler: asyncRequestHandler<SMSCodeRequest>(async ({ body }) => {
        return await accountApplication.requestSMSCode(body?.phoneNumber)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/sms/verify',
      config: { isPublic: true },
      handler: asyncRequestHandler<SMSVerificationResult>(async ({ body }) => {
        return await accountApplication.verifySMSCode(body?.phoneNumber, body?.code)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/collections/accounts',
      handler: asyncRequestHandler<Account | null>(async ({ context }) => {
        return await accountApplication.getAccount(context)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/collections/accounts/:accountId',
      handler: asyncRequestHandler<Account | null, { accountId: string }, never>(async ({ context }) => {
        return await accountApplication.getAccount(context)
      }),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/account/collections/accounts',
      handler: asyncRequestHandler<Account>(async ({ context, body }) => {
        return await accountApplication.updateAccount(context, body)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/avatar',
      handler: asyncRequestHandler<Account>(async ({ context, body }) => {
        return await accountApplication.uploadAvatar(context, body?.base64Data)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/session/validate',
      config: { isPublic: true },
      handler: asyncRequestHandler(async ({ body }) => {
        return await accountApplication.validateSession(body?.sessionToken)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/session/revoke',
      config: { isPublic: true },
      handler: asyncRequestHandler(async ({ body }) => {
        return await accountApplication.revokeSession(body?.sessionToken)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/local-account',
      config: { isPublic: true },
      handler: asyncRequestHandler(async () => {
        return await accountApplication.createLocalAccount()
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/upgrade-account',
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
      url: '/community/collections/communities',
      handler: asyncRequestHandler<Community>(async ({ context, body }) => {
        return await communityApplication.createCommunity(context, { name: body?.name || '', trailIds: body?.trailIds || [] })
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/join',
      handler: asyncRequestHandler<Community>(async ({ context, body }) => {
        return await communityApplication.joinCommunity(context, body?.inviteCode)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/collections/communities',
      handler: asyncRequestHandler<Community[]>(async ({ context }) => {
        return await communityApplication.listCommunities(context)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/collections/communities/:communityId',
      handler: asyncRequestHandler<Community | undefined, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.getCommunity(context, params!.communityId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/collections/communities/:communityId/leave',
      handler: asyncRequestHandler<void, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.leaveCommunity(context, params!.communityId)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/community/collections/communities/:communityId',
      handler: asyncRequestHandler<void, { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.removeCommunity(context, params!.communityId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/collections/communities/:communityId/members',
      handler: asyncRequestHandler<CommunityMember[], { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.listCommunityMembers(context, params!.communityId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/collections/communities/:communityId/discoveries/:discoveryId/share',
      handler: asyncRequestHandler<SharedDiscovery, { communityId: string; discoveryId: string }>(async ({ context, params }) => {
        return await communityApplication.shareDiscovery(context, params!.discoveryId, params!.communityId)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/community/collections/communities/:communityId/discoveries/:discoveryId/share',
      handler: asyncRequestHandler<void, { communityId: string; discoveryId: string }>(async ({ context, params }) => {
        return await communityApplication.unshareDiscovery(context, params!.discoveryId, params!.communityId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/collections/communities/:communityId/discoveries',
      handler: asyncRequestHandler<Discovery[], { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.getSharedDiscoveries(context, params!.communityId)
      }),
    },
  ]
}
export default createRoutes


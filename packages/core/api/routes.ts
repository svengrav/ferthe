/**
 * This file is only for routes.
 * Dont put any business logic here, instead call the relevant application methods.
 * The applications should be accessed via the context parameter.
 * If you find yourself importing an application directly into this file, 
 * it's a sign that the APPLICATION or COMPOSITE method should be added to the context and accessed that way.
 */

import { parseQueryOptions } from '@core/api/oak/queryOptions.ts'
import { createAsyncRequestHandler } from '@core/api/oak/requestHandler.ts'

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

// Import Zod schemas for validation
import {
  AccountUpdateDataSchema,
} from '@shared/contracts/accounts.ts'
import {
  CreateSpotRequestSchema,
  UpdateSpotRequestSchema
} from '@shared/contracts/spots.ts'
import {
  TrailSchema,
} from '@shared/contracts/trails.ts'
import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'

// Common validation schemas
const IdParamSchema = z.object({ id: z.string() })
const SpotIdParamSchema = z.object({ spotId: z.string() })
const TrailIdParamSchema = z.object({ trailId: z.string() })
const DiscoveryIdParamSchema = z.object({ discoveryId: z.string() })
const CommunityIdParamSchema = z.object({ communityId: z.string() })
const AccountIdParamSchema = z.object({ accountId: z.string() })

// Request body schemas
const ProcessLocationSchema = z.object({
  locationWithDirection: z.object({
    location: GeoLocationSchema,
    direction: z.number().optional(),
  }),
  trailId: z.string().optional(),
})

const CreateTrailBodySchema = TrailSchema.omit({ id: true, createdAt: true, updatedAt: true, slug: true }).passthrough()

const UpdateTrailBodySchema = TrailSchema.pick({ name: true, description: true, boundary: true }).partial().passthrough()

const AddSpotToTrailSchema = z.object({
  order: z.number().int().optional(),
})

const TrailRatingBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
})

const CreateScanEventSchema = z.object({
  userPosition: GeoLocationSchema.optional(),
  trailId: z.string().optional(),
})

const SMSRequestSchema = z.object({
  phoneNumber: z.string().min(10),
})

const SMSVerifySchema = z.object({
  phoneNumber: z.string().min(10),
  code: z.string().min(4).max(8),
})

const AccountProfileUpdateSchema = AccountUpdateDataSchema

const AvatarUploadSchema = z.object({
  base64Data: z.string(),
})

const SessionTokenSchema = z.object({
  sessionToken: z.string(),
})

const UpgradeToPhoneSchema = z.object({
  phoneNumber: z.string().min(10),
  code: z.string().min(4).max(8),
})

const DeviceTokenBodySchema = z.object({
  token: z.string(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
})

const CreateCommunitySchema = z.object({
  name: z.string().min(1).max(200),
  trailIds: z.array(z.string()).optional(),
})

const JoinCommunitySchema = z.object({
  inviteCode: z.string(),
})

const UpdateCommunitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  trailIds: z.array(z.string()).optional(),
}).passthrough()

const GetSpotsByIdsSchema = z.object({
  ids: z.array(z.string()),
})

const GetPublicProfilesSchema = z.object({
  accountIds: z.array(z.string()),
})

const ActivateTrailSchema = z.object({
  trailId: z.string(),
})

const WelcomeDiscoverySchema = z.object({
  location: GeoLocationSchema,
})

import { manifest } from './manifest.ts'
import { Route } from './oak/types.ts'

const createRoutes = (ctx: APIContract): Route[] => {
  const { discoveryApplication, sensorApplication, trailApplication, spotApplication, accountApplication, communityApplication, spotAccessComposite, discoveryStateComposite, accountProfileComposite } = ctx

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
      handler: asyncRequestHandler<DiscoveryLocationRecord>(
        {
          schemas: {
            body: ProcessLocationSchema,
          },
        },
        async ({ context: session, body }) => {
          return await discoveryApplication.processLocation(session, body!.locationWithDirection, body!.trailId)
        }
      ),
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
      handler: asyncRequestHandler<DiscoveryProfile>(
        {
          schemas: {
            body: z.any(), // DiscoveryProfile update - partial
          },
        },
        async ({ context: session, body }) => {
          return await discoveryApplication.updateDiscoveryProfile(session, body!)
        }
      ),
    },

    // Welcome Discovery
    {
      method: 'POST',
      version: 'v1',
      url: '/discovery/welcome',
      handler: asyncRequestHandler<WelcomeDiscoveryResult>(
        {
          schemas: {
            body: WelcomeDiscoverySchema,
          },
        },
        async ({ context, body }) => {
          return await discoveryApplication.createWelcomeDiscovery(context, body!.location)
        }
      ),
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
      handler: asyncRequestHandler<DiscoveryContent, { discoveryId: string }>(
        {
          schemas: {
            params: DiscoveryIdParamSchema,
            body: z.any(), // DiscoveryContent - complex type
          },
        },
        async ({ context: session, params, body }) => {
          return await discoveryApplication.upsertDiscoveryContent(session, params!.discoveryId, body!)
        }
      ),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/discovery/discoveries/:discoveryId/content',
      handler: asyncRequestHandler<void, { discoveryId: string }>(
        {
          schemas: {
            params: DiscoveryIdParamSchema,
          },
        },
        async ({ context: session, params }) => {
          return await discoveryApplication.deleteDiscoveryContent(session, params!.discoveryId)
        }
      ),
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
      handler: asyncRequestHandler<SpotRating, { spotId: string }>(
        {
          schemas: {
            params: z.object({ spotId: z.string() }),
            body: z.object({ rating: z.number().int().min(1).max(5) }),
          },
        },
        async ({ context: session, params, body }) => {
          return await discoveryApplication.rateSpot(session, params!.spotId, body!.rating)
        }
      ),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/spot/spots/:spotId/ratings',
      handler: asyncRequestHandler<void, { spotId: string }>(
        {
          schemas: {
            params: SpotIdParamSchema,
          },
        },
        async ({ context: session, params }) => {
          return await discoveryApplication.removeSpotRating(session, params!.spotId)
        }
      ),
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
      handler: asyncRequestHandler<TrailRating, { trailId: string }>(
        {
          schemas: {
            params: TrailIdParamSchema,
            body: TrailRatingBodySchema,
          },
        },
        async ({ context: session, params, body }) => {
          return await trailApplication.rateTrail(session, params!.trailId, body!.rating)
        }
      ),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/trail/trails/:trailId/ratings',
      handler: asyncRequestHandler<void, { trailId: string }>(
        {
          schemas: {
            params: TrailIdParamSchema,
          },
        },
        async ({ context: session, params }) => {
          return await trailApplication.removeTrailRating(session, params!.trailId)
        }
      ),
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
      method: 'POST',
      version: 'v1',
      url: '/trail/trails',
      handler: asyncRequestHandler<Trail, never, Omit<Trail, 'id'>>(
        {
          schemas: {
            body: z.any(), // Trail - complex nested type (map, viewport, overview)
          },
        },
        async ({ context, body }) => {
          return await trailApplication.createTrail(context, body!)
        }
      ),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/trail/trails/:id',
      handler: asyncRequestHandler<Trail, { id: string }, Partial<Trail>>(
        {
          schemas: {
            params: IdParamSchema,
            body: z.any(), // Trail - complex nested type
          },
        },
        async ({ params, context, body }) => {
          return await trailApplication.updateTrail(context, params!.id, body!)
        }
      ),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/trail/trails/:id',
      handler: asyncRequestHandler<void, { id: string }, never>(
        {
          schemas: {
            params: IdParamSchema,
          },
        },
        async ({ params, context }) => {
          return await trailApplication.deleteTrail(context, params!.id)
        }
      ),
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
      method: 'GET',
      version: 'v1',
      url: '/spot/spots',
      handler: asyncRequestHandler<Spot[]>(async ({ context, query }) => {
        return await spotApplication.getSpots(context, parseQueryOptions(query))
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/spot/previews',
      handler: asyncRequestHandler<SpotPreview[]>(async ({ context, query }) => {
        if (query?.ids) {
          return await spotApplication.getSpotPreviewsByIds(context, query.ids.split(','))
        }
        return await spotApplication.getSpotPreviews(parseQueryOptions(query))
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/spot/spots/batch',
      handler: asyncRequestHandler<Spot[], never, { ids: string[] }>(
        {
          schemas: {
            body: GetSpotsByIdsSchema,
          },
        },
        async ({ context, body }) => {
          return await spotApplication.getSpotsByIds(context, body?.ids ?? [])
        }
      ),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/spot/spots',
      handler: asyncRequestHandler<Spot, never, CreateSpotRequest>(
        {
          schemas: {
            body: CreateSpotRequestSchema,
          },
        },
        async ({ context, body }) => {
          return await spotApplication.createSpot(context, body!)
        }
      ),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/spot/spots/:id',
      handler: asyncRequestHandler<Spot | SpotPreview | undefined, { id: string }, never>(async ({ params, context }) => {
        return await spotAccessComposite.getAccessibleSpot(context, params!.id)
      }),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/spot/spots/:id',
      handler: asyncRequestHandler<void, { id: string }, never>(
        {
          schemas: {
            params: IdParamSchema,
          },
        },
        async ({ params, context }) => {
          return await spotApplication.deleteSpot(context, params!.id)
        }
      ),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/spot/spots/:id',
      handler: asyncRequestHandler<Spot, { id: string }, UpdateSpotRequest>(
        {
          schemas: {
            params: IdParamSchema,
            body: UpdateSpotRequestSchema,
          },
        },
        async ({ params, context, body }) => {
          return await spotApplication.updateSpot(context, params!.id, body!)
        }
      ),
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
      handler: asyncRequestHandler<StoredTrailSpot, { trailId: string; spotId: string }, { order?: number }>(
        {
          schemas: {
            params: z.object({ trailId: z.string(), spotId: z.string() }),
            body: AddSpotToTrailSchema,
          },
        },
        async ({ params, context, body }) => {
          return await trailApplication.addSpotToTrail(context, params!.trailId, params!.spotId, body?.order)
        }
      ),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/trail/trails/:trailId/spots/:spotId',
      handler: asyncRequestHandler<void, { trailId: string; spotId: string }, never>(
        {
          schemas: {
            params: z.object({ trailId: z.string(), spotId: z.string() }),
          },
        },
        async ({ params, context }) => {
          return await trailApplication.removeSpotFromTrail(context, params!.trailId, params!.spotId)
        }
      ),
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
      handler: asyncRequestHandler<ScanEvent>(
        {
          schemas: {
            body: CreateScanEventSchema,
          },
        },
        async ({ context: session, body }) => {
          return await sensorApplication.createScanEvent(session, body?.userPosition, body?.trailId)
        }
      ),
    },

    // Account API Routes (Mixed authentication requirements)
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/request-sms',
      config: { isPublic: true },
      handler: asyncRequestHandler<SMSCodeRequest>(
        {
          schemas: {
            body: SMSRequestSchema,
          },
        },
        async ({ body }) => {
          return await accountApplication.requestSMSCode(body!.phoneNumber)
        }
      ),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/verify-sms',
      config: { isPublic: true },
      handler: asyncRequestHandler<SMSVerificationResult>(
        {
          schemas: {
            body: SMSVerifySchema,
          },
        },
        async ({ body }) => {
          return await accountApplication.verifySMSCode(body!.phoneNumber, body!.code)
        }
      ),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/public/profiles/:accountId',
      handler: asyncRequestHandler<AccountPublicProfile, { accountId: string }>(async ({ context, params }) => {
        return await accountProfileComposite.getPublicProfile(context, params!.accountId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/public/profiles',
      handler: asyncRequestHandler<AccountPublicProfile[], never, { accountIds: string[] }>(
        {
          schemas: {
            body: GetPublicProfilesSchema,
          },
        },
        async ({ context, body }) => {
          return await accountProfileComposite.getPublicProfiles(context, body!.accountIds)
        }
      ),
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
      handler: asyncRequestHandler<Account>(
        {
          schemas: {
            body: AccountProfileUpdateSchema,
          },
        },
        async ({ context, body }) => {
          return await accountApplication.updateAccount(context, body!)
        }
      ),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/profile/avatar',
      handler: asyncRequestHandler<Account>(
        {
          schemas: {
            body: AvatarUploadSchema,
          },
        },
        async ({ context, body }) => {
          return await accountApplication.uploadAvatar(context, body!.base64Data)
        }
      ),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/validate-session',
      config: { isPublic: true },
      handler: asyncRequestHandler(
        {
          schemas: {
            body: SessionTokenSchema,
          },
        },
        async ({ body }) => {
          return await accountApplication.validateSession(body!.sessionToken)
        }
      ),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/actions/revoke-session',
      config: { isPublic: true },
      handler: asyncRequestHandler(
        {
          schemas: {
            body: SessionTokenSchema,
          },
        },
        async ({ body }) => {
          return await accountApplication.revokeSession(body!.sessionToken)
        }
      ),
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
      handler: asyncRequestHandler(
        {
          schemas: {
            body: UpgradeToPhoneSchema,
          },
        },
        async ({ context, body }) => {
          return await accountApplication.upgradeToPhoneAccount(context, body!.phoneNumber, body!.code)
        }
      ),
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
      url: '/account/device-token',
      handler: asyncRequestHandler<DeviceToken>(
        {
          schemas: {
            body: DeviceTokenBodySchema,
          },
        },
        async ({ context, body }) => {
          return await accountApplication.registerDeviceToken(context, body!.token, body!.platform)
        }
      ),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/account/device-token',
      handler: asyncRequestHandler<void>(
        {
          schemas: {
            body: z.object({ token: z.string() }),
          },
        },
        async ({ context, body }) => {
          return await accountApplication.removeDeviceToken(context, body!.token)
        }
      ),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/communities',
      handler: asyncRequestHandler<Community>(
        {
          schemas: {
            body: CreateCommunitySchema,
          },
        },
        async ({ context, body }) => {
          return await communityApplication.createCommunity(context, { name: body!.name, trailIds: body!.trailIds || [] })
        }
      ),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/actions/join',
      handler: asyncRequestHandler<Community>(
        {
          schemas: {
            body: JoinCommunitySchema,
          },
        },
        async ({ context, body }) => {
          return await communityApplication.joinCommunity(context, body!.inviteCode)
        }
      ),
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
      method: 'PUT',
      version: 'v1',
      url: '/community/communities/:communityId',
      handler: asyncRequestHandler<Community, { communityId: string }>(
        {
          schemas: {
            params: CommunityIdParamSchema,
            body: UpdateCommunitySchema,
          },
        },
        async ({ context, params, body }) => {
          return await communityApplication.updateCommunity(context, params!.communityId, body!)
        }
      ),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/community/communities/:communityId/actions/leave',
      handler: asyncRequestHandler<void, { communityId: string }>(
        {
          schemas: {
            params: CommunityIdParamSchema,
          },
        },
        async ({ context, params }) => {
          return await communityApplication.leaveCommunity(context, params!.communityId)
        }
      ),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/community/communities/:communityId',
      handler: asyncRequestHandler<void, { communityId: string }>(
        {
          schemas: {
            params: CommunityIdParamSchema,
          },
        },
        async ({ context, params }) => {
          return await communityApplication.removeCommunity(context, params!.communityId)
        }
      ),
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
      handler: asyncRequestHandler<SharedDiscovery, { communityId: string; discoveryId: string }>(
        {
          schemas: {
            params: z.object({ communityId: z.string(), discoveryId: z.string() }),
          },
        },
        async ({ context, params }) => {
          return await communityApplication.shareDiscovery(context, params!.discoveryId, params!.communityId)
        }
      ),
    },
    {
      method: 'DELETE',
      version: 'v1',
      url: '/community/communities/:communityId/discoveries/:discoveryId/share',
      handler: asyncRequestHandler<void, { communityId: string; discoveryId: string }>(
        {
          schemas: {
            params: z.object({ communityId: z.string(), discoveryId: z.string() }),
          },
        },
        async ({ context, params }) => {
          return await communityApplication.unshareDiscovery(context, params!.discoveryId, params!.communityId)
        }
      ),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/community/communities/:communityId/discoveries',
      handler: asyncRequestHandler<Discovery[], { communityId: string }>(async ({ context, params }) => {
        return await communityApplication.getSharedDiscoveries(context, params!.communityId)
      }),
    },

    // Account API Routes
    {
      method: 'POST',
      version: 'v1',
      url: '/account/dev-session',
      config: { isPublic: true },
      handler: asyncRequestHandler<AccountSession, never, { accountId: string }>(
        {
          schemas: {
            body: z.object({ accountId: z.string() }),
          },
        },
        async ({ body }) => {
          // Only allow in development
          const isDevelopment = Deno.env.get('PRODUCTION')?.toLowerCase() !== 'true'
          if (!isDevelopment) {
            return { success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not available in production' } }
          }

          if (!body?.accountId) {
            return { success: false, error: { code: 'MISSING_ACCOUNT_ID', message: 'accountId is required' } }
          }
          return await accountApplication.createDevSession(body.accountId)
        }
      ),
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
      handler: asyncRequestHandler<ActivateTrailResult>(
        {
          schemas: {
            body: ActivateTrailSchema,
          },
        },
        async ({ context, body }) => {
          return await discoveryStateComposite.activateTrail(context, body!.trailId)
        }
      ),
    },
  ]
}
export default createRoutes


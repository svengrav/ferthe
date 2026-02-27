/**
 * API Contracts
 * Defines Zod schemas for all API request/response types used in ts-rest contract
 *
 * - Use LIST for fetching lists, use GET for fetching single items
 * - Use POST for actions that don't fit into CRUD, or when you want to avoid URL length limits (e.g. batch endpoints)
 * - Use PUT for creating/updating resources where the client can provide the ID (or when using a natural key)
 *
 * Routes are grouped by domain: system, spots, trails, discovery, account, sensor, community, content, composite
 */

import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import {
  AccountPublicProfileSchema,
  AccountSchema,
  AccountSessionSchema,
  DeviceTokenSchema,
  SessionValidationResultSchema,
  SMSCodeRequestSchema,
  SMSVerificationResultSchema,
} from '../contracts/accounts.ts'
import {
  CommunityMemberSchema,
  CommunitySchema,
  SharedDiscoverySchema,
} from '../contracts/communities.ts'
import {
  ActivateTrailResultSchema,
  DiscoveryStateSchema,
} from '../contracts/composites.ts'
import { FirebaseConfigSchema } from '../contracts/config.ts'
import {
  BlogPostSchema,
  ContentPageSchema,
  FeedbackRequestSchema,
} from '../contracts/content.ts'
import {
  ClueSchema,
  DiscoveryContentSchema,
  DiscoveryLocationRecordSchema,
  DiscoverySchema,
  DiscoveryStatsSchema,
  DiscoveryTrailSchema,
  WelcomeDiscoveryResultSchema,
} from '../contracts/discoveries.ts'
import { DiscoveryProfileSchema } from '../contracts/discoveryProfile.ts'
import { ScanEventSchema } from '../contracts/sensors.ts'
import {
  CreateSpotRequestSchema,
  RatingSummarySchema,
  SpotPreviewSchema,
  SpotRatingSchema,
  SpotSchema,
  UpdateSpotRequestSchema,
} from '../contracts/spots.ts'
import {
  TrailRatingSchema,
  TrailSchema,
  TrailStatsSchema,
} from '../contracts/trails.ts'
import { StoredTrailSpotSchema, TrailSpotSchema } from '../contracts/trailSpots.ts'

// ── Shared Schemas ────────────────────────────────────────────────────────────

const ManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  env: z.string(),
})

const DiscoverySpotSchema = SpotSchema.extend({
  discoveredAt: z.date().optional(),
  discoveryId: z.string(),
})

const PaginationQuerySchema = z.object({
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
})

const OrderableQuerySchema = PaginationQuerySchema.extend({
  orderBy: z.string().optional(),
})

const IdsQuerySchema = PaginationQuerySchema.extend({
  ids: z.string().optional(),
})

const TrailFilterQuerySchema = PaginationQuerySchema.extend({
  trailId: z.string().optional(),
})

const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
})

const successResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  })

const PageMetaSchema = z.object({
  hasMore: z.boolean().optional(),
  nextOffset: z.number().optional(),
  total: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

const pagedSuccessResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    meta: PageMetaSchema.optional(),
  })

const errorResponse = () => ErrorResponseSchema

const c = initContract()

/**
 * Ferthe API Contract
 * Routes are grouped by domain. HTTP paths are unchanged from the flat version.
 */
export const apiContract = c.router({

  // ── System ────────────────────────────────────────────────────────────────
  system: c.router({
    getManifest: {
      method: 'GET',
      path: '/',
      responses: { 200: successResponse(ManifestSchema) },
      summary: 'Get API manifest',
    },
    getStatus: {
      method: 'GET',
      path: '/status',
      responses: { 200: successResponse(z.object({ status: z.string(), message: z.string() })) },
      summary: 'Health check endpoint',
    },
  }),

  // ── Spots ─────────────────────────────────────────────────────────────────
  spots: c.router({
    listSpots: {
      method: 'GET',
      path: '/spot/spots',
      responses: { 200: pagedSuccessResponse(SpotSchema) },
      query: OrderableQuerySchema,
      summary: 'List all spots',
    },
    listSpotPreviews: {
      method: 'GET',
      path: '/spot/previews',
      responses: { 200: pagedSuccessResponse(SpotPreviewSchema) },
      query: IdsQuerySchema,
      summary: 'List spot previews',
    },
    getSpot: {
      method: 'GET',
      path: '/spot/spots/:id',
      pathParams: z.object({ id: z.string() }),
      responses: { 200: successResponse(SpotSchema.optional()), 404: errorResponse() },
      summary: 'Get spot by ID',
    },
    createSpot: {
      method: 'POST',
      path: '/spot/spots',
      body: CreateSpotRequestSchema,
      responses: { 200: successResponse(SpotSchema), 400: errorResponse() },
      summary: 'Create a new spot',
    },
    updateSpot: {
      method: 'PUT',
      path: '/spot/spots/:id',
      pathParams: z.object({ id: z.string() }),
      body: UpdateSpotRequestSchema,
      responses: { 200: successResponse(SpotSchema), 404: errorResponse() },
      summary: 'Update a spot',
    },
    deleteSpot: {
      method: 'DELETE',
      path: '/spot/spots/:id',
      pathParams: z.object({ id: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()), 404: errorResponse() },
      summary: 'Delete a spot',
    },
    rateSpot: {
      method: 'POST',
      path: '/spot/spots/:id/ratings',
      pathParams: z.object({ id: z.string() }),
      body: z.object({ rating: z.number().int().min(1).max(5) }),
      responses: { 200: successResponse(SpotRatingSchema) },
      summary: 'Rate a spot',
    },
    getSpotRatingSummary: {
      method: 'GET',
      path: '/spot/spots/:id/ratings',
      pathParams: z.object({ id: z.string() }),
      responses: { 200: successResponse(RatingSummarySchema) },
      summary: 'Get spot rating summary',
    },
    removeSpotRating: {
      method: 'DELETE',
      path: '/spot/spots/:spotId/ratings',
      pathParams: z.object({ spotId: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()) },
      summary: 'Remove spot rating',
    },
    getSpotsByIds: {
      method: 'POST',
      path: '/spot/spots/batch',
      body: z.object({ ids: z.array(z.string()) }),
      responses: { 200: successResponse(z.array(SpotSchema)) },
      summary: 'Get multiple spots by IDs',
    },
  }),

  // ── Trails ────────────────────────────────────────────────────────────────
  trails: c.router({
    listTrails: {
      method: 'GET',
      path: '/trail/trails',
      responses: { 200: pagedSuccessResponse(TrailSchema.passthrough()) },
      query: PaginationQuerySchema.extend({ createdBy: z.string().optional() }),
      summary: 'List all trails',
    },
    getTrail: {
      method: 'GET',
      path: '/trail/trails/:id',
      pathParams: z.object({ id: z.string() }),
      responses: { 200: successResponse(TrailSchema.passthrough().optional()) },
      summary: 'Get trail by ID',
    },
    createTrail: {
      method: 'POST',
      path: '/trail/trails',
      body: z.any(),
      responses: { 200: successResponse(TrailSchema.passthrough()), 400: errorResponse() },
      summary: 'Create a new trail',
    },
    updateTrail: {
      method: 'PUT',
      path: '/trail/trails/:id',
      pathParams: z.object({ id: z.string() }),
      body: z.any(),
      responses: { 200: successResponse(TrailSchema.passthrough()), 404: errorResponse() },
      summary: 'Update a trail',
    },
    deleteTrail: {
      method: 'DELETE',
      path: '/trail/trails/:id',
      pathParams: z.object({ id: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()), 404: errorResponse() },
      summary: 'Delete a trail',
    },
    getTrailSpots: {
      method: 'GET',
      path: '/trail/trails/:trailId/spots',
      pathParams: z.object({ trailId: z.string() }),
      responses: { 200: successResponse(z.array(TrailSpotSchema)) },
      summary: 'Get spots in trail',
    },
    getTrailStats: {
      method: 'GET',
      path: '/trail/trails/:trailId/stats',
      pathParams: z.object({ trailId: z.string() }),
      responses: { 200: successResponse(TrailStatsSchema) },
      summary: 'Get trail statistics',
    },
    addSpotToTrail: {
      method: 'POST',
      path: '/trail/trails/:trailId/spots',
      pathParams: z.object({ trailId: z.string() }),
      body: z.object({ spotId: z.string(), order: z.number().int().optional() }),
      responses: { 200: successResponse(StoredTrailSpotSchema) },
      summary: 'Add spot to trail',
    },
    removeSpotFromTrail: {
      method: 'DELETE',
      path: '/trail/trails/:trailId/spots/:spotId',
      pathParams: z.object({ trailId: z.string(), spotId: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()) },
      summary: 'Remove spot from trail',
    },
    getTrailRatingSummary: {
      method: 'GET',
      path: '/trail/trails/:trailId/ratings',
      pathParams: z.object({ trailId: z.string() }),
      responses: { 200: successResponse(RatingSummarySchema) },
      summary: 'Get trail rating summary',
    },
    rateTrail: {
      method: 'POST',
      path: '/trail/trails/:trailId/ratings',
      pathParams: z.object({ trailId: z.string() }),
      body: z.object({ rating: z.number().int().min(1).max(5) }),
      responses: { 200: successResponse(TrailRatingSchema) },
      summary: 'Rate a trail',
    },
    removeTrailRating: {
      method: 'DELETE',
      path: '/trail/trails/:trailId/ratings',
      pathParams: z.object({ trailId: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()) },
      summary: 'Remove trail rating',
    },
  }),

  // ── Discovery ─────────────────────────────────────────────────────────────
  discovery: c.router({
    processLocation: {
      method: 'POST',
      path: '/discovery/actions/process-location',
      body: z.object({ locationWithDirection: z.any(), trailId: z.string() }),
      responses: { 200: successResponse(DiscoveryLocationRecordSchema) },
      summary: 'Process location for discovery',
    },
    listDiscoveries: {
      method: 'GET',
      path: '/discovery/discoveries',
      responses: { 200: pagedSuccessResponse(DiscoverySchema) },
      query: TrailFilterQuerySchema,
      summary: 'List discoveries',
    },
    getDiscovery: {
      method: 'GET',
      path: '/discovery/discoveries/:id',
      pathParams: z.object({ id: z.string() }),
      responses: { 200: successResponse(DiscoverySchema), 404: errorResponse() },
      summary: 'Get discovery by ID',
    },
    listDiscoveredSpots: {
      method: 'GET',
      path: '/discovery/spots',
      responses: { 200: pagedSuccessResponse(DiscoverySpotSchema) },
      query: TrailFilterQuerySchema,
      summary: 'List discovered spots',
    },
    getDiscoveredPreviewClues: {
      method: 'GET',
      path: '/discovery/trails/:trailId/clues',
      pathParams: z.object({ trailId: z.string() }),
      responses: { 200: successResponse(z.array(ClueSchema)) },
      summary: 'Get discovered preview clues for trail',
    },
    getDiscoveryTrail: {
      method: 'GET',
      path: '/discovery/trails/:trailId',
      pathParams: z.object({ trailId: z.string() }),
      responses: { 200: successResponse(DiscoveryTrailSchema) },
      summary: 'Get discovery trail',
    },
    getDiscoveryProfile: {
      method: 'GET',
      path: '/discovery/profile',
      responses: { 200: successResponse(DiscoveryProfileSchema) },
      summary: 'Get discovery profile',
    },
    updateDiscoveryProfile: {
      method: 'PUT',
      path: '/discovery/profile',
      body: z.any(),
      responses: { 200: successResponse(DiscoveryProfileSchema) },
      summary: 'Update discovery profile',
    },
    getDiscoveryStats: {
      method: 'GET',
      path: '/discovery/discoveries/:discoveryId/stats',
      pathParams: z.object({ discoveryId: z.string() }),
      responses: { 200: successResponse(DiscoveryStatsSchema) },
      summary: 'Get discovery statistics',
    },
    getDiscoveryContent: {
      method: 'GET',
      path: '/discovery/discoveries/:discoveryId/content',
      pathParams: z.object({ discoveryId: z.string() }),
      responses: { 200: successResponse(DiscoveryContentSchema.optional()) },
      summary: 'Get discovery content',
    },
    upsertDiscoveryContent: {
      method: 'PUT',
      path: '/discovery/discoveries/:discoveryId/content',
      pathParams: z.object({ discoveryId: z.string() }),
      body: z.any(),
      responses: { 200: successResponse(DiscoveryContentSchema) },
      summary: 'Create or update discovery content',
    },
    deleteDiscoveryContent: {
      method: 'DELETE',
      path: '/discovery/discoveries/:discoveryId/content',
      pathParams: z.object({ discoveryId: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()) },
      summary: 'Delete discovery content',
    },
    createWelcomeDiscovery: {
      method: 'POST',
      path: '/discovery/welcome',
      body: z.object({ location: z.any() }),
      responses: { 200: successResponse(WelcomeDiscoveryResultSchema) },
      summary: 'Create welcome discovery',
    },
  }),

  // ── Account ───────────────────────────────────────────────────────────────
  account: c.router({
    requestSMSCode: {
      method: 'POST',
      path: '/account/actions/request-sms',
      body: z.object({ phoneNumber: z.string().min(10) }),
      responses: { 200: successResponse(SMSCodeRequestSchema) },
      summary: 'Request SMS verification code',
    },
    verifySMSCode: {
      method: 'POST',
      path: '/account/actions/verify-sms',
      body: z.object({ phoneNumber: z.string().min(10), code: z.string().min(4).max(8) }),
      responses: { 200: successResponse(SMSVerificationResultSchema), 400: errorResponse() },
      summary: 'Verify SMS code',
    },
    getPublicProfile: {
      method: 'GET',
      path: '/account/public/profiles/:accountId',
      pathParams: z.object({ accountId: z.string() }),
      responses: { 200: successResponse(AccountPublicProfileSchema) },
      summary: 'Get public account profile',
    },
    getPublicProfiles: {
      method: 'POST',
      path: '/account/public/profiles',
      body: z.object({ accountIds: z.array(z.string()) }),
      responses: { 200: successResponse(z.array(AccountPublicProfileSchema)) },
      summary: 'Get multiple public profiles',
    },
    getAccountProfile: {
      method: 'GET',
      path: '/account/profile',
      responses: { 200: successResponse(AccountSchema.nullable()) },
      summary: 'Get own account profile',
    },
    updateAccountProfile: {
      method: 'PUT',
      path: '/account/profile',
      body: z.any(),
      responses: { 200: successResponse(AccountSchema) },
      summary: 'Update account profile',
    },
    uploadAvatar: {
      method: 'POST',
      path: '/account/profile/avatar',
      body: z.object({ base64Data: z.string() }),
      responses: { 200: successResponse(AccountSchema) },
      summary: 'Upload avatar',
    },
    validateSession: {
      method: 'POST',
      path: '/account/actions/validate-session',
      body: z.object({ sessionToken: z.string() }),
      responses: { 200: successResponse(SessionValidationResultSchema) },
      summary: 'Validate session token',
    },
    revokeSession: {
      method: 'POST',
      path: '/account/actions/revoke-session',
      body: z.object({ sessionToken: z.string() }),
      responses: { 200: successResponse(z.void()) },
      summary: 'Revoke session',
    },
    createLocalAccount: {
      method: 'POST',
      path: '/account/actions/create-local',
      body: z.undefined(),
      responses: { 200: successResponse(AccountSessionSchema) },
      summary: 'Create local account',
    },
    upgradeToPhoneAccount: {
      method: 'POST',
      path: '/account/actions/upgrade-to-phone',
      body: z.object({ phoneNumber: z.string().min(10), code: z.string().min(4).max(8) }),
      responses: { 200: successResponse(AccountSessionSchema), 400: errorResponse() },
      summary: 'Upgrade to phone account',
    },
    getFirebaseConfig: {
      method: 'GET',
      path: '/account/config/firebase',
      responses: { 200: successResponse(FirebaseConfigSchema) },
      summary: 'Get Firebase config',
    },
    registerDeviceToken: {
      method: 'POST',
      path: '/account/device-token',
      body: z.object({ token: z.string(), platform: z.enum(['ios', 'android', 'web']).optional() }),
      responses: { 200: successResponse(DeviceTokenSchema) },
      summary: 'Register device token',
    },
    removeDeviceToken: {
      method: 'DELETE',
      path: '/account/device-token',
      body: z.object({ token: z.string() }),
      responses: { 200: successResponse(z.void()) },
      summary: 'Remove device token',
    },
  }),

  // ── Sensor ────────────────────────────────────────────────────────────────
  sensor: c.router({
    listScanEvents: {
      method: 'GET',
      path: '/sensor/scans',
      responses: { 200: pagedSuccessResponse(ScanEventSchema) },
      query: z.object({ trailId: z.string().optional() }),
      summary: 'List scan events',
    },
    createScanEvent: {
      method: 'POST',
      path: '/sensor/scans',
      body: z.object({ userPosition: z.any().optional(), trailId: z.string().optional() }),
      responses: { 200: successResponse(ScanEventSchema) },
      summary: 'Create scan event',
    },
  }),

  // ── Community ─────────────────────────────────────────────────────────────
  community: c.router({
    createCommunity: {
      method: 'POST',
      path: '/community/communities',
      body: z.object({ name: z.string().min(1).max(200), trailIds: z.array(z.string()).optional() }),
      responses: { 200: successResponse(CommunitySchema), 400: errorResponse() },
      summary: 'Create community',
    },
    joinCommunity: {
      method: 'POST',
      path: '/community/actions/join',
      body: z.object({ inviteCode: z.string() }),
      responses: { 200: successResponse(CommunitySchema), 400: errorResponse() },
      summary: 'Join community',
    },
    listCommunities: {
      method: 'GET',
      path: '/community/communities',
      responses: { 200: successResponse(z.array(CommunitySchema)) },
      summary: 'List communities',
    },
    getCommunity: {
      method: 'GET',
      path: '/community/communities/:communityId',
      pathParams: z.object({ communityId: z.string() }),
      responses: { 200: successResponse(CommunitySchema.optional()) },
      summary: 'Get community',
    },
    updateCommunity: {
      method: 'PUT',
      path: '/community/communities/:communityId',
      pathParams: z.object({ communityId: z.string() }),
      body: z.object({ name: z.string().min(1).max(200).optional(), trailIds: z.array(z.string()).optional() }).passthrough(),
      responses: { 200: successResponse(CommunitySchema), 404: errorResponse() },
      summary: 'Update community',
    },
    leaveCommunity: {
      method: 'POST',
      path: '/community/communities/:communityId/actions/leave',
      pathParams: z.object({ communityId: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()) },
      summary: 'Leave community',
    },
    removeCommunity: {
      method: 'DELETE',
      path: '/community/communities/:communityId',
      pathParams: z.object({ communityId: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()) },
      summary: 'Remove community',
    },
    listCommunityMembers: {
      method: 'GET',
      path: '/community/communities/:communityId/members',
      pathParams: z.object({ communityId: z.string() }),
      responses: { 200: successResponse(z.array(CommunityMemberSchema)) },
      summary: 'List community members',
    },
    shareDiscovery: {
      method: 'POST',
      path: '/community/communities/:communityId/discoveries/:discoveryId/share',
      pathParams: z.object({ communityId: z.string(), discoveryId: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(SharedDiscoverySchema) },
      summary: 'Share discovery in community',
    },
    unshareDiscovery: {
      method: 'DELETE',
      path: '/community/communities/:communityId/discoveries/:discoveryId/share',
      pathParams: z.object({ communityId: z.string(), discoveryId: z.string() }),
      body: z.undefined(),
      responses: { 200: successResponse(z.void()) },
      summary: 'Unshare discovery',
    },
    getSharedDiscoveries: {
      method: 'GET',
      path: '/community/communities/:communityId/discoveries',
      pathParams: z.object({ communityId: z.string() }),
      responses: { 200: successResponse(z.array(DiscoverySchema)) },
      summary: 'Get shared discoveries',
    },
  }),

  // ── Content (served by web package, not core) ─────────────────────────────
  content: c.router({
    getContentPage: {
      method: 'GET',
      path: '/content/:language/pages/:page',
      pathParams: z.object({ language: z.enum(['en', 'de']), page: z.string() }),
      responses: { 200: successResponse(ContentPageSchema), 404: errorResponse() },
      summary: 'Get static content page',
    },
    listBlogPosts: {
      method: 'GET',
      path: '/content/:language/blog',
      pathParams: z.object({ language: z.enum(['en', 'de']) }),
      responses: { 200: successResponse(z.array(BlogPostSchema)) },
      summary: 'List blog posts',
    },
    getBlogPost: {
      method: 'GET',
      path: '/content/:language/blog/:slug',
      pathParams: z.object({ language: z.enum(['en', 'de']), slug: z.string() }),
      responses: { 200: successResponse(BlogPostSchema), 404: errorResponse() },
      summary: 'Get blog post by slug',
    },
    submitFeedback: {
      method: 'POST',
      path: '/content/feedback',
      body: FeedbackRequestSchema,
      responses: { 200: successResponse(z.object({ received: z.literal(true) })), 400: errorResponse() },
      summary: 'Submit user feedback',
    },
  }),

  // ── Composite ─────────────────────────────────────────────────────────────
  composite: c.router({
    getAccessibleSpots: {
      method: 'GET',
      path: '/composite/spots/accessible',
      responses: { 200: successResponse(z.array(SpotSchema)) },
      query: z.object({ trailId: z.string().optional(), limit: z.coerce.number().optional(), offset: z.coerce.number().optional() }),
      summary: 'Get accessible spots',
    },
    getDiscoveryState: {
      method: 'GET',
      path: '/composite/discovery/state',
      responses: { 200: successResponse(DiscoveryStateSchema) },
      summary: 'Get aggregated discovery state',
    },
    activateTrail: {
      method: 'POST',
      path: '/composite/discovery/actions/activate-trail',
      body: z.object({ trailId: z.string() }),
      responses: { 200: successResponse(ActivateTrailResultSchema) },
      summary: 'Activate trail',
    },
  }),
})

export type ApiContract = typeof apiContract

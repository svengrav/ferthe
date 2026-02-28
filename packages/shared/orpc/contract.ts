/**
 * oRPC API Contract
 * Defines input/output schemas for all procedures.
 * Shared between server (core) and client (app, web).
 *
 * Routes are grouped by domain: system, spots, trails, discovery, account, sensor, community, content, composite
 * Input is a flat object (path params + body/query merged).
 */

import { oc } from '@orpc/contract'
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

const CursorInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().nullish(),
})

function pagedOutput<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().optional() })
}

// ── Contract ──────────────────────────────────────────────────────────────────

export const apiContract = {

  // ── System ────────────────────────────────────────────────────────────────
  system: {
    getManifest: oc
      .route({ method: 'GET', path: '/' })
      .output(ManifestSchema),

    getStatus: oc
      .route({ method: 'GET', path: '/status' })
      .output(z.object({ status: z.string(), message: z.string() })),
  },

  // ── Spots ─────────────────────────────────────────────────────────────────
  spots: {
    list: oc
      .route({ method: 'GET', path: '/spot/spots' })
      .input(CursorInputSchema.extend({ orderBy: z.string().optional() }))
      .output(pagedOutput(SpotSchema)),

    listPreviews: oc
      .route({ method: 'GET', path: '/spot/previews' })
      .input(CursorInputSchema.extend({ ids: z.string().optional() }))
      .output(pagedOutput(SpotPreviewSchema)),

    get: oc
      .route({ method: 'GET', path: '/spot/spots/{id}' })
      .input(z.object({ id: z.string() }))
      .output(z.union([SpotSchema, SpotPreviewSchema]).optional()),

    create: oc
      .route({ method: 'POST', path: '/spot/spots' })
      .input(CreateSpotRequestSchema)
      .output(SpotSchema),

    update: oc
      .route({ method: 'PUT', path: '/spot/spots/{id}' })
      .input(UpdateSpotRequestSchema.extend({ id: z.string() }))
      .output(SpotSchema),

    delete: oc
      .route({ method: 'DELETE', path: '/spot/spots/{id}' })
      .input(z.object({ id: z.string() }))
      .output(z.void()),

    rate: oc
      .route({ method: 'POST', path: '/spot/spots/{id}/ratings' })
      .input(z.object({ id: z.string(), rating: z.number().int().min(1).max(5) }))
      .output(SpotRatingSchema),

    getRatingSummary: oc
      .route({ method: 'GET', path: '/spot/spots/{id}/ratings' })
      .input(z.object({ id: z.string() }))
      .output(RatingSummarySchema),

    removeRating: oc
      .route({ method: 'DELETE', path: '/spot/spots/{spotId}/ratings' })
      .input(z.object({ spotId: z.string() }))
      .output(z.void()),

    getByIds: oc
      .route({ method: 'POST', path: '/spot/spots/batch' })
      .input(z.object({ ids: z.array(z.string()) }))
      .output(z.array(SpotSchema)),
  },

  // ── Trails ────────────────────────────────────────────────────────────────
  trails: {
    list: oc
      .route({ method: 'GET', path: '/trail/trails' })
      .input(CursorInputSchema.extend({ createdBy: z.string().optional() }))
      .output(pagedOutput(TrailSchema.loose())),

    get: oc
      .route({ method: 'GET', path: '/trail/trails/{id}' })
      .input(z.object({ id: z.string() }))
      .output(TrailSchema.loose().optional()),

    create: oc
      .route({ method: 'POST', path: '/trail/trails' })
      .input(z.any())
      .output(TrailSchema.loose()),

    update: oc
      .route({ method: 'PUT', path: '/trail/trails/{id}' })
      .input(z.object({ id: z.string() }).loose())
      .output(TrailSchema.loose()),

    delete: oc
      .route({ method: 'DELETE', path: '/trail/trails/{id}' })
      .input(z.object({ id: z.string() }))
      .output(z.void()),

    listSpots: oc
      .route({ method: 'GET', path: '/trail/trails/{trailId}/spots' })
      .input(CursorInputSchema.extend({ trailId: z.string() }))
      .output(pagedOutput(TrailSpotSchema)),

    getStats: oc
      .route({ method: 'GET', path: '/trail/trails/{trailId}/stats' })
      .input(z.object({ trailId: z.string() }))
      .output(TrailStatsSchema),

    addSpot: oc
      .route({ method: 'POST', path: '/trail/trails/{trailId}/spots' })
      .input(z.object({ trailId: z.string(), spotId: z.string(), order: z.number().int().optional() }))
      .output(StoredTrailSpotSchema),

    removeSpot: oc
      .route({ method: 'DELETE', path: '/trail/trails/{trailId}/spots/{spotId}' })
      .input(z.object({ trailId: z.string(), spotId: z.string() }))
      .output(z.void()),

    getRatingSummary: oc
      .route({ method: 'GET', path: '/trail/trails/{trailId}/ratings' })
      .input(z.object({ trailId: z.string() }))
      .output(RatingSummarySchema),

    rate: oc
      .route({ method: 'POST', path: '/trail/trails/{trailId}/ratings' })
      .input(z.object({ trailId: z.string(), rating: z.number().int().min(1).max(5) }))
      .output(TrailRatingSchema),

    removeRating: oc
      .route({ method: 'DELETE', path: '/trail/trails/{trailId}/ratings' })
      .input(z.object({ trailId: z.string() }))
      .output(z.void()),
  },

  // ── Discovery ─────────────────────────────────────────────────────────────
  discovery: {
    processLocation: oc
      .route({ method: 'POST', path: '/discovery/actions/process-location' })
      .input(z.object({ trailId: z.string(), locationWithDirection: z.any() }))
      .output(DiscoveryLocationRecordSchema),

    list: oc
      .route({ method: 'GET', path: '/discovery/discoveries' })
      .input(CursorInputSchema.extend({ trailId: z.string().optional() }))
      .output(pagedOutput(DiscoverySchema)),

    get: oc
      .route({ method: 'GET', path: '/discovery/discoveries/{id}' })
      .input(z.object({ id: z.string() }))
      .output(DiscoverySchema.optional()),

    listSpots: oc
      .route({ method: 'GET', path: '/discovery/spots' })
      .input(CursorInputSchema.extend({ trailId: z.string().optional() }))
      .output(pagedOutput(DiscoverySpotSchema)),

    listPreviewClues: oc
      .route({ method: 'GET', path: '/discovery/trails/{trailId}/clues' })
      .input(CursorInputSchema.extend({ trailId: z.string() }))
      .output(pagedOutput(ClueSchema)),

    getTrail: oc
      .route({ method: 'GET', path: '/discovery/trails/{trailId}' })
      .input(z.object({ trailId: z.string() }))
      .output(DiscoveryTrailSchema),

    getProfile: oc
      .route({ method: 'GET', path: '/discovery/profile' })
      .output(DiscoveryProfileSchema),

    updateProfile: oc
      .route({ method: 'PUT', path: '/discovery/profile' })
      .input(z.any())
      .output(DiscoveryProfileSchema),

    getStats: oc
      .route({ method: 'GET', path: '/discovery/discoveries/{discoveryId}/stats' })
      .input(z.object({ discoveryId: z.string() }))
      .output(DiscoveryStatsSchema),

    getContent: oc
      .route({ method: 'GET', path: '/discovery/discoveries/{discoveryId}/content' })
      .input(z.object({ discoveryId: z.string() }))
      .output(DiscoveryContentSchema.optional()),

    upsertContent: oc
      .route({ method: 'PUT', path: '/discovery/discoveries/{discoveryId}/content' })
      .input(z.object({ discoveryId: z.string() }).loose())
      .output(DiscoveryContentSchema),

    deleteContent: oc
      .route({ method: 'DELETE', path: '/discovery/discoveries/{discoveryId}/content' })
      .input(z.object({ discoveryId: z.string() }))
      .output(z.void()),

    createWelcome: oc
      .route({ method: 'POST', path: '/discovery/welcome' })
      .input(z.object({ location: z.any() }))
      .output(WelcomeDiscoveryResultSchema),
  },

  // ── Account ───────────────────────────────────────────────────────────────
  account: {
    requestSMSCode: oc
      .route({ method: 'POST', path: '/account/actions/request-sms' })
      .input(z.object({ phoneNumber: z.string().min(10) }))
      .output(SMSCodeRequestSchema),

    verifySMSCode: oc
      .route({ method: 'POST', path: '/account/actions/verify-sms' })
      .input(z.object({ phoneNumber: z.string().min(10), code: z.string().min(4).max(8), client: z.enum(['app', 'creator']).optional() }))
      .output(SMSVerificationResultSchema),

    getPublicProfile: oc
      .route({ method: 'GET', path: '/account/public/profiles/{accountId}' })
      .input(z.object({ accountId: z.string() }))
      .output(AccountPublicProfileSchema),

    getPublicProfiles: oc
      .route({ method: 'POST', path: '/account/public/profiles' })
      .input(z.object({ accountIds: z.array(z.string()) }))
      .output(z.array(AccountPublicProfileSchema)),

    getProfile: oc
      .route({ method: 'GET', path: '/account/profile' })
      .output(AccountSchema.nullable()),

    updateProfile: oc
      .route({ method: 'PUT', path: '/account/profile' })
      .input(z.any())
      .output(AccountSchema),

    uploadAvatar: oc
      .route({ method: 'POST', path: '/account/profile/avatar' })
      .input(z.object({ base64Data: z.string() }))
      .output(AccountSchema),

    validateSession: oc
      .route({ method: 'POST', path: '/account/actions/validate-session' })
      .input(z.object({ sessionToken: z.string() }))
      .output(SessionValidationResultSchema),

    revokeSession: oc
      .route({ method: 'POST', path: '/account/actions/revoke-session' })
      .input(z.object({ sessionToken: z.string() }))
      .output(z.void()),

    createLocalAccount: oc
      .route({ method: 'POST', path: '/account/actions/create-local' })
      .output(AccountSessionSchema),

    upgradeToPhoneAccount: oc
      .route({ method: 'POST', path: '/account/actions/upgrade-to-phone' })
      .input(z.object({ phoneNumber: z.string().min(10), code: z.string().min(4).max(8) }))
      .output(AccountSessionSchema),

    getFirebaseConfig: oc
      .route({ method: 'GET', path: '/account/config/firebase' })
      .output(FirebaseConfigSchema),

    registerDeviceToken: oc
      .route({ method: 'POST', path: '/account/device-token' })
      .input(z.object({ token: z.string(), platform: z.enum(['ios', 'android', 'web']).optional() }))
      .output(DeviceTokenSchema),

    removeDeviceToken: oc
      .route({ method: 'DELETE', path: '/account/device-token' })
      .input(z.object({ token: z.string() }))
      .output(z.void()),
  },

  // ── Sensor ────────────────────────────────────────────────────────────────
  sensor: {
    listScans: oc
      .route({ method: 'GET', path: '/sensor/scans' })
      .input(CursorInputSchema.extend({ trailId: z.string().optional() }))
      .output(pagedOutput(ScanEventSchema)),

    createScan: oc
      .route({ method: 'POST', path: '/sensor/scans' })
      .input(z.object({ userPosition: z.any().optional(), trailId: z.string().optional() }))
      .output(ScanEventSchema),
  },

  // ── Community ─────────────────────────────────────────────────────────────
  community: {
    create: oc
      .route({ method: 'POST', path: '/community/communities' })
      .input(z.object({ name: z.string().min(1).max(200), trailIds: z.array(z.string()).optional() }))
      .output(CommunitySchema),

    join: oc
      .route({ method: 'POST', path: '/community/actions/join' })
      .input(z.object({ inviteCode: z.string() }))
      .output(CommunitySchema),

    list: oc
      .route({ method: 'GET', path: '/community/communities' })
      .input(CursorInputSchema.optional())
      .output(pagedOutput(CommunitySchema)),

    get: oc
      .route({ method: 'GET', path: '/community/communities/{communityId}' })
      .input(z.object({ communityId: z.string() }))
      .output(CommunitySchema.optional()),

    update: oc
      .route({ method: 'PUT', path: '/community/communities/{communityId}' })
      .input(z.object({ communityId: z.string(), name: z.string().min(1).max(200).optional(), trailIds: z.array(z.string()).optional() }))
      .output(CommunitySchema),

    leave: oc
      .route({ method: 'POST', path: '/community/communities/{communityId}/actions/leave' })
      .input(z.object({ communityId: z.string() }))
      .output(z.void()),

    delete: oc
      .route({ method: 'DELETE', path: '/community/communities/{communityId}' })
      .input(z.object({ communityId: z.string() }))
      .output(z.void()),

    listMembers: oc
      .route({ method: 'GET', path: '/community/communities/{communityId}/members' })
      .input(CursorInputSchema.extend({ communityId: z.string() }))
      .output(pagedOutput(CommunityMemberSchema)),

    shareDiscovery: oc
      .route({ method: 'POST', path: '/community/communities/{communityId}/discoveries/{discoveryId}/share' })
      .input(z.object({ communityId: z.string(), discoveryId: z.string() }))
      .output(SharedDiscoverySchema),

    unshareDiscovery: oc
      .route({ method: 'DELETE', path: '/community/communities/{communityId}/discoveries/{discoveryId}/share' })
      .input(z.object({ communityId: z.string(), discoveryId: z.string() }))
      .output(z.void()),

    listSharedDiscoveries: oc
      .route({ method: 'GET', path: '/community/communities/{communityId}/discoveries' })
      .input(CursorInputSchema.extend({ communityId: z.string() }))
      .output(pagedOutput(DiscoverySchema)),
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    getPage: oc
      .route({ method: 'POST', path: '/content/get-page' })
      .input(z.object({ language: z.enum(['en', 'de']), page: z.string() }))
      .output(ContentPageSchema),

    listBlogPosts: oc
      .route({ method: 'POST', path: '/content/list-blog-posts' })
      .input(CursorInputSchema.extend({ language: z.enum(['en', 'de']) }))
      .output(pagedOutput(BlogPostSchema)),

    getBlogPost: oc
      .route({ method: 'POST', path: '/content/get-blog-post' })
      .input(z.object({ language: z.enum(['en', 'de']), slug: z.string() }))
      .output(BlogPostSchema),

    submitFeedback: oc
      .route({ method: 'POST', path: '/content/feedback' })
      .input(FeedbackRequestSchema)
      .output(z.object({ received: z.literal(true) })),
  },

  // ── Composite ─────────────────────────────────────────────────────────────
  composite: {
    listAccessibleSpots: oc
      .route({ method: 'GET', path: '/composite/spots/accessible' })
      .input(CursorInputSchema.extend({ trailId: z.string().optional() }))
      .output(pagedOutput(SpotSchema)),

    getDiscoveryState: oc
      .route({ method: 'GET', path: '/composite/discovery/state' })
      .output(DiscoveryStateSchema),

    activateTrail: oc
      .route({ method: 'POST', path: '/composite/discovery/actions/activate-trail' })
      .input(z.object({ trailId: z.string() }))
      .output(ActivateTrailResultSchema),
  },
}

export type ApiContract = typeof apiContract

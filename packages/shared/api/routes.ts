/**
 * Central API Route Registry
 * Single source of truth for all API endpoints
 */

import {
  AccountPublicProfileSchema,
  AccountSchema,
  AccountSessionSchema,
  AccountUpdateDataSchema,
  ClientAudienceSchema,
  DeviceTokenSchema,
} from '@shared/contracts/accounts.ts'
import {
  CommunityMemberSchema,
  CommunitySchema,
  SharedDiscoverySchema,
} from '@shared/contracts/communities.ts'
import {
  ActivateTrailResultSchema,
  DiscoveryStateSchema,
} from '@shared/contracts/composites.ts'
import {
  FirebaseConfigSchema,
} from '@shared/contracts/config.ts'
import { FeedbackRequestSchema, LanguageSchema } from '@shared/contracts/content.ts'
import {
  ClueSchema,
  DiscoveryContentSchema,
  DiscoveryLocationRecordSchema,
  DiscoverySchema,
  DiscoveryStatsSchema,
  DiscoveryTrailSchema,
  LocationWithDirectionSchema,
  UpsertDiscoveryContentRequestSchema,
  WelcomeDiscoveryResultSchema,
} from '@shared/contracts/discoveries.ts'
import { DiscoveryProfileSchema, DiscoveryProfileUpdateDataSchema } from '@shared/contracts/discoveryProfile.ts'
import { ResultSchema } from '@shared/contracts/results.ts'
import { ScanEventSchema } from '@shared/contracts/sensors.ts'
import {
  CreateSpotRequestSchema,
  RatingSummarySchema,
  SpotPreviewSchema,
  SpotRatingSchema,
  SpotSchema,
  UpdateSpotRequestSchema,
} from '@shared/contracts/spots.ts'
import {
  CreateTrailRequestSchema,
  TrailRatingSchema,
  TrailSchema,
  TrailStatsSchema,
  UpdateTrailRequestSchema,
} from '@shared/contracts/trails.ts'
import { TrailSpotSchema } from '@shared/contracts/trailSpots.ts'
import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'
import type { RouteRegistry } from './types.ts'

// ──────────────────────────────────────────────────────────────
// Query & Params Schemas
// ──────────────────────────────────────────────────────────────

/**
 * Base list query schema
 */
export const ListQuerySchema = z.object({
  limit: z.number().optional(),
  cursor: z.string().nullable().optional(),
  orderBy: z.string().optional(),
})

/**
 * Trail-specific list query
 */
export const TrailListQuerySchema = ListQuerySchema.extend({
  createdBy: z.string().optional(),
})

/**
 * Spot preview query
 */
export const SpotPreviewQuerySchema = ListQuerySchema.extend({
  ids: z.string().optional(),
})

/**
 * Discovery list query
 */
export const DiscoveryListQuerySchema = ListQuerySchema.extend({
  trailId: z.string().optional(),
})

/**
 * Accessible spots query
 */
export const AccessibleSpotsQuerySchema = ListQuerySchema.extend({
  trailId: z.string().optional(),
})

// ──────────────────────────────────────────────────────────────
// API-specific Response Schemas
// ──────────────────────────────────────────────────────────────

/**
 * System manifest response
 */
const ManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
})

/**
 * System status response
 */
const StatusSchema = z.object({
  status: z.string(),
  message: z.string(),
})

/**
 * Success response
 */
const SuccessSchema = z.object({
  success: z.boolean(),
})

/**
 * Content page response
 */
const ContentPageResponseSchema = z.object({
  content: z.string(),
})

/**
 * Blog post preview for list
 */
const BlogPostPreviewSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  excerpt: z.string().optional(),
})

/**
 * Blog post detail response
 */
const BlogPostDetailSchema = z.object({
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  date: z.string(),
})

/**
 * Discovery spot (Spot + discovery metadata)
 */
const DiscoverySpotSchema = SpotSchema.extend({
  discoveredAt: z.date().optional(),
  discoveryId: z.string(),
})

/**
 * Central route registry - all API endpoints defined here
 */
export const routes: RouteRegistry = {
  // ─────────────────────────────────────────────────────────────
  // System Routes
  // ─────────────────────────────────────────────────────────────
  system: [
    {
      id: 'getManifest',
      version: 'v1',
      method: 'GET',
      path: '/',
      config: { isPublic: true },
      output: ResultSchema(ManifestSchema),
    },
    {
      id: 'getStatus',
      version: 'v1',
      method: 'GET',
      path: '/status',
      config: { isPublic: true },
      output: ResultSchema(StatusSchema),
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // Spot Routes
  // ─────────────────────────────────────────────────────────────
  spot: [
    {
      id: 'listSpots',
      version: 'v1',
      method: 'GET',
      path: '/spot/spots',
      query: ListQuerySchema,
      output: ResultSchema(z.array(SpotSchema)),
    },
    {
      id: 'listPreviews',
      version: 'v1',
      method: 'GET',
      path: '/spot/previews',
      query: SpotPreviewQuerySchema,
      output: ResultSchema(z.array(SpotPreviewSchema)),
    },
    {
      id: 'getSpot',
      version: 'v1',
      method: 'GET',
      path: '/spot/spots/:id',
      params: z.object({ id: z.string() }),
      output: ResultSchema(SpotSchema.optional()),
    },
    {
      id: 'getSpotPreview',
      version: 'v1',
      method: 'GET',
      path: '/spot/spots/:id/preview',
      config: { isPublic: true },
      params: z.object({ id: z.string() }),
      output: ResultSchema(SpotPreviewSchema.optional()),
    },
    {
      id: 'getSpotsByIds',
      version: 'v1',
      method: 'POST',
      path: '/spot/spots/batch',
      input: z.object({ ids: z.array(z.string()) }),
      output: ResultSchema(z.array(SpotSchema)),
    },
    {
      id: 'createSpot',
      version: 'v1',
      method: 'POST',
      path: '/spot/spots',
      input: CreateSpotRequestSchema,
      output: ResultSchema(SpotSchema),
    },
    {
      id: 'updateSpot',
      version: 'v1',
      method: 'PUT',
      path: '/spot/spots/:id',
      params: z.object({ id: z.string() }),
      input: UpdateSpotRequestSchema,
      output: ResultSchema(SpotSchema),
    },
    {
      id: 'deleteSpot',
      version: 'v1',
      method: 'DELETE',
      path: '/spot/spots/:id',
      params: z.object({ id: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'getSpotRatings',
      version: 'v1',
      method: 'GET',
      path: '/spot/spots/:spotId/ratings',
      params: z.object({ spotId: z.string() }),
      output: ResultSchema(RatingSummarySchema),
    },
    {
      id: 'rateSpot',
      version: 'v1',
      method: 'POST',
      path: '/spot/spots/:spotId/ratings',
      params: z.object({ spotId: z.string() }),
      input: z.object({ rating: z.number().int().min(1).max(5) }),
      output: ResultSchema(SpotRatingSchema),
    },
    {
      id: 'removeSpotRating',
      version: 'v1',
      method: 'DELETE',
      path: '/spot/spots/:spotId/ratings',
      params: z.object({ spotId: z.string() }),
      output: ResultSchema(z.void()),
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // Trail Routes
  // ─────────────────────────────────────────────────────────────
  trail: [
    {
      id: 'listTrails',
      version: 'v1',
      method: 'GET',
      path: '/trail/trails',
      query: TrailListQuerySchema,
      output: ResultSchema(z.array(TrailSchema)),
    },
    {
      id: 'getTrail',
      version: 'v1',
      method: 'GET',
      path: '/trail/trails/:id',
      params: z.object({ id: z.string() }),
      output: ResultSchema(TrailSchema.optional()),
    },
    {
      id: 'createTrail',
      version: 'v1',
      method: 'POST',
      path: '/trail/trails',
      input: CreateTrailRequestSchema,
      output: ResultSchema(TrailSchema),
    },
    {
      id: 'updateTrail',
      version: 'v1',
      method: 'PUT',
      path: '/trail/trails/:id',
      params: z.object({ id: z.string() }),
      input: UpdateTrailRequestSchema,
      output: ResultSchema(TrailSchema),
    },
    {
      id: 'deleteTrail',
      version: 'v1',
      method: 'DELETE',
      path: '/trail/trails/:id',
      params: z.object({ id: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'getTrailSpots',
      version: 'v1',
      method: 'GET',
      path: '/trail/trails/:trailId/spots',
      params: z.object({ trailId: z.string() }),
      output: ResultSchema(z.array(TrailSpotSchema)),
    },
    {
      id: 'getTrailStats',
      version: 'v1',
      method: 'GET',
      path: '/trail/trails/:trailId/stats',
      params: z.object({ trailId: z.string() }),
      output: ResultSchema(TrailStatsSchema),
    },
    {
      id: 'addSpotToTrail',
      version: 'v1',
      method: 'POST',
      path: '/trail/trails/:trailId/spots/:spotId',
      params: z.object({ trailId: z.string(), spotId: z.string() }),
      input: z.object({ order: z.number().int().optional() }),
      output: ResultSchema(TrailSpotSchema),
    },
    {
      id: 'removeSpotFromTrail',
      version: 'v1',
      method: 'DELETE',
      path: '/trail/trails/:trailId/spots/:spotId',
      params: z.object({ trailId: z.string(), spotId: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'getTrailRatings',
      version: 'v1',
      method: 'GET',
      path: '/trail/trails/:trailId/ratings',
      params: z.object({ trailId: z.string() }),
      output: ResultSchema(RatingSummarySchema),
    },
    {
      id: 'rateTrail',
      version: 'v1',
      method: 'POST',
      path: '/trail/trails/:trailId/ratings',
      params: z.object({ trailId: z.string() }),
      input: z.object({ rating: z.number().int().min(1).max(5) }),
      output: ResultSchema(TrailRatingSchema),
    },
    {
      id: 'removeTrailRating',
      version: 'v1',
      method: 'DELETE',
      path: '/trail/trails/:trailId/ratings',
      params: z.object({ trailId: z.string() }),
      output: ResultSchema(z.void()),
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // Discovery Routes
  // ─────────────────────────────────────────────────────────────
  discovery: [
    {
      id: 'processLocation',
      version: 'v1',
      method: 'POST',
      path: '/discovery/actions/process-location',
      input: z.object({
        locationWithDirection: LocationWithDirectionSchema,
        trailId: z.string().optional(),
      }),
      output: ResultSchema(DiscoveryLocationRecordSchema),
    },
    {
      id: 'listDiscoveries',
      version: 'v1',
      method: 'GET',
      path: '/discovery/discoveries',
      query: DiscoveryListQuerySchema,
      output: ResultSchema(z.array(DiscoverySchema)),
    },
    {
      id: 'getDiscovery',
      version: 'v1',
      method: 'GET',
      path: '/discovery/discoveries/:id',
      params: z.object({ id: z.string() }),
      output: ResultSchema(DiscoverySchema.optional()),
    },
    {
      id: 'listDiscoveredSpots',
      version: 'v1',
      method: 'GET',
      path: '/discovery/spots',
      query: DiscoveryListQuerySchema,
      output: ResultSchema(z.array(DiscoverySpotSchema)),
    },
    {
      id: 'listPreviewClues',
      version: 'v1',
      method: 'GET',
      path: '/discovery/trails/:trailId/clues',
      params: z.object({ trailId: z.string() }),
      output: ResultSchema(z.array(ClueSchema)),
    },
    {
      id: 'getDiscoveryTrail',
      version: 'v1',
      method: 'GET',
      path: '/discovery/trails/:trailId',
      params: z.object({ trailId: z.string() }),
      output: ResultSchema(DiscoveryTrailSchema),
    },
    {
      id: 'getProfile',
      version: 'v1',
      method: 'GET',
      path: '/discovery/profile',
      output: ResultSchema(DiscoveryProfileSchema),
    },
    {
      id: 'updateProfile',
      version: 'v1',
      method: 'PUT',
      path: '/discovery/profile',
      input: DiscoveryProfileUpdateDataSchema,
      output: ResultSchema(DiscoveryProfileSchema),
    },
    {
      id: 'getDiscoveryStats',
      version: 'v1',
      method: 'GET',
      path: '/discovery/discoveries/:discoveryId/stats',
      params: z.object({ discoveryId: z.string() }),
      output: ResultSchema(DiscoveryStatsSchema),
    },
    {
      id: 'getDiscoveryContent',
      version: 'v1',
      method: 'GET',
      path: '/discovery/discoveries/:discoveryId/content',
      params: z.object({ discoveryId: z.string() }),
      output: ResultSchema(DiscoveryContentSchema.optional()),
    },
    {
      id: 'upsertDiscoveryContent',
      version: 'v1',
      method: 'PUT',
      path: '/discovery/discoveries/:discoveryId/content',
      params: z.object({ discoveryId: z.string() }),
      input: UpsertDiscoveryContentRequestSchema,
      output: ResultSchema(DiscoveryContentSchema),
    },
    {
      id: 'deleteDiscoveryContent',
      version: 'v1',
      method: 'DELETE',
      path: '/discovery/discoveries/:discoveryId/content',
      params: z.object({ discoveryId: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'createWelcome',
      version: 'v1',
      method: 'POST',
      path: '/discovery/welcome',
      input: z.object({ location: GeoLocationSchema }),
      output: ResultSchema(WelcomeDiscoveryResultSchema),
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // Account Routes
  // ─────────────────────────────────────────────────────────────
  account: [
    {
      id: 'requestSMSCode',
      version: 'v1',
      method: 'POST',
      path: '/account/actions/request-sms',
      config: { isPublic: true },
      input: z.object({ phoneNumber: z.string() }),
      output: ResultSchema(SuccessSchema),
    },
    {
      id: 'verifySMSCode',
      version: 'v1',
      method: 'POST',
      path: '/account/actions/verify-sms',
      config: { isPublic: true },
      input: z.object({
        phoneNumber: z.string(),
        code: z.string(),
        client: ClientAudienceSchema.optional(),
      }),
      output: ResultSchema(AccountSessionSchema),
    },
    {
      id: 'getPublicProfile',
      version: 'v1',
      method: 'GET',
      path: '/account/public/profiles/:accountId',
      params: z.object({ accountId: z.string() }),
      output: ResultSchema(AccountPublicProfileSchema),
    },
    {
      id: 'getPublicProfiles',
      version: 'v1',
      method: 'POST',
      path: '/account/public/profiles',
      input: z.object({ accountIds: z.array(z.string()) }),
      output: ResultSchema(z.array(AccountPublicProfileSchema)),
    },
    {
      id: 'getProfile',
      version: 'v1',
      method: 'GET',
      path: '/account/profile',
      output: ResultSchema(AccountSchema),
    },
    {
      id: 'updateProfile',
      version: 'v1',
      method: 'PUT',
      path: '/account/profile',
      input: AccountUpdateDataSchema,
      output: ResultSchema(AccountSchema),
    },
    {
      id: 'uploadAvatar',
      version: 'v1',
      method: 'POST',
      path: '/account/profile/avatar',
      input: z.object({ base64Data: z.string() }),
      output: ResultSchema(AccountSchema),
    },
    {
      id: 'validateSession',
      version: 'v1',
      method: 'POST',
      path: '/account/actions/validate-session',
      input: z.object({ sessionToken: z.string() }),
      output: ResultSchema(AccountSessionSchema),
    },
    {
      id: 'revokeSession',
      version: 'v1',
      method: 'POST',
      path: '/account/actions/revoke-session',
      input: z.object({ sessionToken: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'createLocalAccount',
      version: 'v1',
      method: 'POST',
      path: '/account/actions/create-local',
      config: { isPublic: true },
      output: ResultSchema(AccountSessionSchema),
    },
    {
      id: 'upgradeToPhoneAccount',
      version: 'v1',
      method: 'POST',
      path: '/account/actions/upgrade-to-phone',
      input: z.object({ phoneNumber: z.string(), code: z.string() }),
      output: ResultSchema(AccountSessionSchema),
    },
    {
      id: 'getFirebaseConfig',
      version: 'v1',
      method: 'GET',
      path: '/account/config/firebase',
      output: ResultSchema(FirebaseConfigSchema),
    },
    {
      id: 'registerDeviceToken',
      version: 'v1',
      method: 'POST',
      path: '/account/device-token',
      input: z.object({
        token: z.string(),
        platform: z.enum(['ios', 'android', 'web']).optional(),
      }),
      output: ResultSchema(DeviceTokenSchema),
    },
    {
      id: 'removeDeviceToken',
      version: 'v1',
      method: 'DELETE',
      path: '/account/device-token',
      input: z.object({ token: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'createDevSession',
      version: 'v1',
      method: 'POST',
      path: '/account/dev-session',
      config: { isPublic: true, devOnly: true },
      input: z.object({ accountId: z.string() }),
      output: ResultSchema(AccountSessionSchema),
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // Community Routes
  // ─────────────────────────────────────────────────────────────
  community: [
    {
      id: 'createCommunity',
      version: 'v1',
      method: 'POST',
      path: '/community/communities',
      input: z.object({
        name: z.string(),
        trailIds: z.array(z.string()).optional(),
      }),
      output: ResultSchema(CommunitySchema),
    },
    {
      id: 'joinCommunity',
      version: 'v1',
      method: 'POST',
      path: '/community/actions/join',
      input: z.object({ inviteCode: z.string() }),
      output: ResultSchema(CommunitySchema),
    },
    {
      id: 'listCommunities',
      version: 'v1',
      method: 'GET',
      path: '/community/communities',
      query: ListQuerySchema,
      output: ResultSchema(z.array(CommunitySchema)),
    },
    {
      id: 'getCommunity',
      version: 'v1',
      method: 'GET',
      path: '/community/communities/:communityId',
      params: z.object({ communityId: z.string() }),
      output: ResultSchema(CommunitySchema),
    },
    {
      id: 'updateCommunity',
      version: 'v1',
      method: 'PUT',
      path: '/community/communities/:communityId',
      params: z.object({ communityId: z.string() }),
      input: z.object({
        name: z.string().optional(),
        trailIds: z.array(z.string()).optional(),
      }),
      output: ResultSchema(CommunitySchema),
    },
    {
      id: 'leaveCommunity',
      version: 'v1',
      method: 'POST',
      path: '/community/communities/:communityId/actions/leave',
      params: z.object({ communityId: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'deleteCommunity',
      version: 'v1',
      method: 'DELETE',
      path: '/community/communities/:communityId',
      params: z.object({ communityId: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'listMembers',
      version: 'v1',
      method: 'GET',
      path: '/community/communities/:communityId/members',
      params: z.object({ communityId: z.string() }),
      query: ListQuerySchema,
      output: ResultSchema(z.array(CommunityMemberSchema)),
    },
    {
      id: 'shareDiscovery',
      version: 'v1',
      method: 'POST',
      path: '/community/communities/:communityId/discoveries/:discoveryId/share',
      params: z.object({ communityId: z.string(), discoveryId: z.string() }),
      output: ResultSchema(SharedDiscoverySchema),
    },
    {
      id: 'unshareDiscovery',
      version: 'v1',
      method: 'DELETE',
      path: '/community/communities/:communityId/discoveries/:discoveryId/share',
      params: z.object({ communityId: z.string(), discoveryId: z.string() }),
      output: ResultSchema(z.void()),
    },
    {
      id: 'listSharedDiscoveries',
      version: 'v1',
      method: 'GET',
      path: '/community/communities/:communityId/discoveries',
      params: z.object({ communityId: z.string() }),
      query: ListQuerySchema,
      output: ResultSchema(z.array(DiscoverySchema)),
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // Sensor Routes
  // ─────────────────────────────────────────────────────────────
  sensor: [
    {
      id: 'listScans',
      version: 'v1',
      method: 'GET',
      path: '/sensor/scans',
      query: DiscoveryListQuerySchema,
      output: ResultSchema(z.array(ScanEventSchema)),
    },
    {
      id: 'createScan',
      version: 'v1',
      method: 'POST',
      path: '/sensor/scans',
      input: z.object({
        userPosition: GeoLocationSchema.optional(),
        trailId: z.string().optional(),
      }),
      output: ResultSchema(ScanEventSchema),
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // Content Routes
  // ─────────────────────────────────────────────────────────────
  content: [
    {
      id: 'getPage',
      version: 'v1',
      method: 'GET',
      path: '/content/pages/:language/:page',
      params: z.object({ language: LanguageSchema, page: z.string() }),
      config: { isPublic: true },
      output: ResultSchema(ContentPageResponseSchema),
    },
    {
      id: 'listBlogPosts',
      version: 'v1',
      method: 'GET',
      path: '/content/blog/:language',
      params: z.object({ language: LanguageSchema }),
      query: ListQuerySchema,
      config: { isPublic: true },
      output: ResultSchema(z.array(BlogPostPreviewSchema)),
    },
    {
      id: 'getBlogPost',
      version: 'v1',
      method: 'GET',
      path: '/content/blog/:language/:slug',
      params: z.object({ language: LanguageSchema, slug: z.string() }),
      config: { isPublic: true },
      output: ResultSchema(BlogPostDetailSchema),
    },
    {
      id: 'submitFeedback',
      version: 'v1',
      method: 'POST',
      path: '/content/feedback',
      input: FeedbackRequestSchema,
      output: ResultSchema(SuccessSchema),
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // Composite Routes
  // ─────────────────────────────────────────────────────────────
  composite: [
    {
      id: 'listAccessibleSpots',
      version: 'v1',
      method: 'GET',
      path: '/composite/spots/accessible',
      query: AccessibleSpotsQuerySchema,
      output: ResultSchema(z.array(SpotSchema)),
    },
    {
      id: 'getDiscoveryState',
      version: 'v1',
      method: 'GET',
      path: '/composite/discovery/state',
      output: ResultSchema(DiscoveryStateSchema),
    },
    {
      id: 'activateTrail',
      version: 'v1',
      method: 'POST',
      path: '/composite/discovery/actions/activate-trail',
      input: z.object({ trailId: z.string() }),
      output: ResultSchema(ActivateTrailResultSchema),
    },
  ],
}

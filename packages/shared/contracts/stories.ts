import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { ImageReferenceSchema } from './images.ts'
import { Result } from './results.ts'
import { guard } from './strings.ts'

// ──────────────────────────────────────────────────────────────
// Schema
// ──────────────────────────────────────────────────────────────

export const StoryVisibilitySchema = z.enum(['private', 'public'])
export type StoryVisibility = z.infer<typeof StoryVisibilitySchema>

/**
 * Story — user content (image + comment) for a Spot (via discovery) or Trail.
 * Spot stories reference a discoveryId; trail stories reference a trailId.
 */
export const StorySchema = z.object({
  id: guard.idString,
  accountId: guard.idString,
  discoveryId: guard.idString.optional(),  // set for spot stories
  spotId: guard.idString.optional(),
  trailId: guard.idString.optional(),
  image: ImageReferenceSchema.optional(),
  comment: z.string().max(10000).optional(),
  visibility: StoryVisibilitySchema,
  likedByAccountIds: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Story = z.infer<typeof StorySchema>

export const upsertStoryRequestSchema = z.object({
  imageUrl: z.url().optional(),
  removeImage: z.boolean().optional(),
  comment: z.string().max(10000).optional(),
  visibility: StoryVisibilitySchema.optional(),
})
export type UpsertStoryRequest = z.infer<typeof upsertStoryRequestSchema>

// ──────────────────────────────────────────────────────────────
// Application Contract
// ──────────────────────────────────────────────────────────────

export interface StoryApplicationContract {
  getSpotStory: (context: AccountContext, discoveryId: string) => Promise<Result<Story | undefined>>
  getTrailStory: (context: AccountContext, trailId: string) => Promise<Result<Story | undefined>>
  upsertSpotStory: (context: AccountContext, discoveryId: string, data: UpsertStoryRequest) => Promise<Result<Story>>
  upsertTrailStory: (context: AccountContext, trailId: string, data: UpsertStoryRequest) => Promise<Result<Story>>
  deleteStory: (context: AccountContext, storyId: string) => Promise<Result<void>>
  listPublicStoriesBySpot: (context: AccountContext, spotId: string) => Promise<Result<Story[]>>
  listPublicStoriesByTrail: (context: AccountContext, trailId: string) => Promise<Result<Story[]>>
  likeStory: (context: AccountContext, storyId: string) => Promise<Result<Story>>
  unlikeStory: (context: AccountContext, storyId: string) => Promise<Result<Story>>
}

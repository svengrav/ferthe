import type { ApiClient } from '@shared/api'
import { Result, Story, UpsertStoryRequest } from '@shared/contracts'
import { getStoryActions } from './stores/storyStore'

export interface StoryApplication {
  getSpotStory: (discoveryId: string) => Promise<Result<Story | undefined>>
  getTrailStory: (trailId: string) => Promise<Result<Story | undefined>>
  upsertSpotStory: (discoveryId: string, data: UpsertStoryRequest) => Promise<Result<Story>>
  upsertTrailStory: (trailId: string, data: UpsertStoryRequest) => Promise<Result<Story>>
  deleteStory: (storyId: string, contextId: string) => Promise<Result<void>>
  listPublicStoriesBySpot: (spotId: string) => Promise<Result<Story[]>>
  listPublicStoriesByTrail: (trailId: string) => Promise<Result<Story[]>>
  likeStory: (storyId: string) => Promise<Result<Story>>
  unlikeStory: (storyId: string) => Promise<Result<Story>>
}

export function createStoryApplication({ api }: { api: ApiClient }): StoryApplication {
  const { setStory, clearStory } = getStoryActions()

  return {
    getSpotStory: async (discoveryId) => {
      const result = await api.story.getSpotStory(discoveryId)
      if (result.data) setStory(discoveryId, result.data)
      else if (result.success) clearStory(discoveryId)
      return result
    },

    getTrailStory: async (trailId) => {
      const result = await api.story.getTrailStory(trailId)
      if (result.data) setStory(trailId, result.data)
      else if (result.success) clearStory(trailId)
      return result
    },

    upsertSpotStory: async (discoveryId, data) => {
      const result = await api.story.upsertSpotStory(discoveryId, data)
      if (result.data) setStory(discoveryId, result.data)
      return result
    },

    upsertTrailStory: async (trailId, data) => {
      const result = await api.story.upsertTrailStory(trailId, data)
      if (result.data) setStory(trailId, result.data)
      return result
    },

    deleteStory: async (storyId, contextId) => {
      const result = await api.story.deleteStory(storyId)
      if (result.success) clearStory(contextId)
      return result
    },

    listPublicStoriesBySpot: spotId => api.story.listPublicStoriesBySpot(spotId),
    listPublicStoriesByTrail: trailId => api.story.listPublicStoriesByTrail(trailId),

    likeStory: storyId => api.story.likeStory(storyId),
    unlikeStory: storyId => api.story.unlikeStory(storyId),
  }
}

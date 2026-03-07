import { Store } from '@core/store/storeFactory'
import { createDeterministicId } from '@core/utils/idGenerator'
import {
  AccountContext,
  createErrorResult,
  createSuccessResult,
  Discovery,
  ImageApplicationContract,
  Result,
  Story,
  StoryApplicationContract,
  UpsertStoryRequest,
} from '@shared/contracts/index.ts'

interface StoryApplicationOptions {
  storyStore: Store<Story>
  discoveryStore: Store<Discovery>
  imageApplication?: ImageApplicationContract
}

export function createStoryApplication({
  storyStore,
  discoveryStore,
  imageApplication,
}: StoryApplicationOptions): StoryApplicationContract {

  // ── Helpers ────────────────────────────────────────────────

  const handleImageUpload = async (
    context: AccountContext,
    contextId: string,
    imageUrl: string,
  ): Promise<string | undefined> => {
    if (!imageUrl.startsWith('data:image')) return imageUrl
    if (!imageApplication) return undefined

    const uploadResult = await imageApplication.processAndStore(
      context, 'story', contextId, imageUrl, { processImage: true, blur: false },
    )
    if (!uploadResult.success || !uploadResult.data) return undefined

    const urlResult = await imageApplication.refreshImageUrl(context, uploadResult.data.blobPath)
    return urlResult.success ? urlResult.data : undefined
  }

  // ── Read ───────────────────────────────────────────────────

  const getSpotStory = async (
    context: AccountContext,
    discoveryId: string,
  ): Promise<Result<Story | undefined>> => {
    try {
      const accountId = context.accountId
      if (!accountId) return createErrorResult('ACCOUNT_ID_REQUIRED')
      const storyId = createDeterministicId(accountId, discoveryId)
      const result = await storyStore.get(storyId)
      return createSuccessResult(result.data)
    } catch (error: any) {
      return createErrorResult('GET_CONTENT_ERROR', { originalError: error.message })
    }
  }

  const getTrailStory = async (
    context: AccountContext,
    trailId: string,
  ): Promise<Result<Story | undefined>> => {
    try {
      const accountId = context.accountId
      if (!accountId) return createErrorResult('ACCOUNT_ID_REQUIRED')
      const storyId = createDeterministicId(accountId, trailId)
      const result = await storyStore.get(storyId)
      return createSuccessResult(result.data)
    } catch (error: any) {
      return createErrorResult('GET_CONTENT_ERROR', { originalError: error.message })
    }
  }

  const listPublicStoriesBySpot = async (
    _context: AccountContext,
    spotId: string,
  ): Promise<Result<Story[]>> => {
    try {
      const result = await storyStore.list()
      if (!result.success) return createErrorResult('GET_CONTENT_ERROR')
      const stories = (result.data ?? []).filter(
        s => s.spotId === spotId && s.visibility === 'public',
      )
      return createSuccessResult(deduplicateByAccount(stories))
    } catch (error: any) {
      return createErrorResult('GET_CONTENT_ERROR', { originalError: error.message })
    }
  }

  const listPublicStoriesByTrail = async (
    _context: AccountContext,
    trailId: string,
  ): Promise<Result<Story[]>> => {
    try {
      const result = await storyStore.list()
      if (!result.success) return createErrorResult('GET_CONTENT_ERROR')
      const stories = (result.data ?? []).filter(
        s => s.trailId === trailId && s.visibility === 'public',
      )
      return createSuccessResult(deduplicateByAccount(stories))
    } catch (error: any) {
      return createErrorResult('GET_CONTENT_ERROR', { originalError: error.message })
    }
  }

  // ── Write ──────────────────────────────────────────────────

  /** Create or update a spot story. One story per account+discovery. */
  const upsertSpotStory = async (
    context: AccountContext,
    discoveryId: string,
    data: UpsertStoryRequest,
  ): Promise<Result<Story>> => {
    try {
      const accountId = context.accountId
      if (!accountId) return createErrorResult('ACCOUNT_ID_REQUIRED')

      const discoveryResult = await discoveryStore.get(discoveryId)
      if (!discoveryResult.success || !discoveryResult.data) return createErrorResult('DISCOVERY_NOT_FOUND')
      const discovery = discoveryResult.data
      if (discovery.accountId !== accountId) return createErrorResult('NOT_AUTHORIZED')

      const storyId = createDeterministicId(accountId, discoveryId)
      const now = new Date()

      let finalImageUrl = data.imageUrl
      if (data.imageUrl) finalImageUrl = await handleImageUpload(context, storyId, data.imageUrl)

      const existing = await storyStore.get(storyId)

      if (data.removeImage && existing.data?.image?.url && imageApplication) {
        await imageApplication.deleteImage(context, existing.data.image.url)
      }

      const resolvedImage = (): Story['image'] => {
        if (data.removeImage) return undefined
        if (finalImageUrl) return { id: '', url: finalImageUrl }
        return existing.success && existing.data ? existing.data.image : undefined
      }
      const story: Story = existing.success && existing.data
        ? {
          ...existing.data,
          comment: data.comment ?? existing.data.comment,
          visibility: data.visibility ?? existing.data.visibility,
          image: resolvedImage(),
          updatedAt: now,
        }
        : {
          id: storyId,
          accountId,
          discoveryId,
          spotId: discovery.spotId,
          trailId: discovery.trailId,
          comment: data.comment,
          visibility: data.visibility ?? 'private',
          image: resolvedImage(),
          likedByAccountIds: [],
          createdAt: now,
          updatedAt: now,
        }

      const saveResult = existing.success && existing.data
        ? await storyStore.update(storyId, story)
        : await storyStore.create(story)

      return saveResult.success ? createSuccessResult(story) : createErrorResult('SAVE_CONTENT_ERROR')
    } catch (error: any) {
      return createErrorResult('UPDATE_CONTENT_ERROR', { originalError: error.message })
    }
  }

  /** Create or update a trail story. One story per account+trail. */
  const upsertTrailStory = async (
    context: AccountContext,
    trailId: string,
    data: UpsertStoryRequest,
  ): Promise<Result<Story>> => {
    try {
      const accountId = context.accountId
      if (!accountId) return createErrorResult('ACCOUNT_ID_REQUIRED')

      const storyId = createDeterministicId(accountId, trailId)
      const now = new Date()

      let finalImageUrl = data.imageUrl
      if (data.imageUrl) finalImageUrl = await handleImageUpload(context, storyId, data.imageUrl)

      const existing = await storyStore.get(storyId)

      if (data.removeImage && existing.data?.image?.url && imageApplication) {
        await imageApplication.deleteImage(context, existing.data.image.url)
      }

      const resolvedImage = (): Story['image'] => {
        if (data.removeImage) return undefined
        if (finalImageUrl) return { id: '', url: finalImageUrl }
        return existing.success && existing.data ? existing.data.image : undefined
      }
      const story: Story = existing.success && existing.data
        ? {
          ...existing.data,
          comment: data.comment ?? existing.data.comment,
          visibility: data.visibility ?? existing.data.visibility,
          image: resolvedImage(),
          updatedAt: now,
        }
        : {
          id: storyId,
          accountId,
          trailId,
          comment: data.comment,
          visibility: data.visibility ?? 'private',
          image: resolvedImage(),
          likedByAccountIds: [],
          createdAt: now,
          updatedAt: now,
        }

      const saveResult = existing.success && existing.data
        ? await storyStore.update(storyId, story)
        : await storyStore.create(story)

      return saveResult.success ? createSuccessResult(story) : createErrorResult('SAVE_CONTENT_ERROR')
    } catch (error: any) {
      return createErrorResult('UPDATE_CONTENT_ERROR', { originalError: error.message })
    }
  }

  const deleteStory = async (
    context: AccountContext,
    storyId: string,
  ): Promise<Result<void>> => {
    try {
      const accountId = context.accountId
      if (!accountId) return createErrorResult('ACCOUNT_ID_REQUIRED')

      const existing = await storyStore.get(storyId)
      if (!existing.success || !existing.data) return createSuccessResult(undefined)
      if (existing.data.accountId !== accountId) return createErrorResult('NOT_AUTHORIZED')

      if (existing.data.image?.url && imageApplication) {
        await imageApplication.deleteImage(context, existing.data.image.url)
      }

      const result = await storyStore.delete(storyId)
      return result.success ? createSuccessResult(undefined) : createErrorResult('DELETE_CONTENT_ERROR')
    } catch (error: any) {
      return createErrorResult('DELETE_CONTENT_ERROR', { originalError: error.message })
    }
  }

  return {
    getSpotStory,
    getTrailStory,
    upsertSpotStory,
    upsertTrailStory,
    deleteStory,
    listPublicStoriesBySpot,
    listPublicStoriesByTrail,

    likeStory: async (context: AccountContext, storyId: string) => {
      try {
        const accountId = context.accountId
        if (!accountId) return createErrorResult('ACCOUNT_ID_REQUIRED')
        const existing = await storyStore.get(storyId)
        if (!existing.success || !existing.data) return createErrorResult('GET_CONTENT_ERROR')
        const liked = existing.data.likedByAccountIds ?? []
        if (liked.includes(accountId)) return createSuccessResult(existing.data)
        const updated: Story = { ...existing.data, likedByAccountIds: [...liked, accountId], updatedAt: new Date() }
        const result = await storyStore.update(storyId, updated)
        return result.success ? createSuccessResult(updated) : createErrorResult('SAVE_CONTENT_ERROR')
      } catch (error: any) {
        return createErrorResult('SAVE_CONTENT_ERROR', { originalError: error.message })
      }
    },

    unlikeStory: async (context: AccountContext, storyId: string) => {
      try {
        const accountId = context.accountId
        if (!accountId) return createErrorResult('ACCOUNT_ID_REQUIRED')
        const existing = await storyStore.get(storyId)
        if (!existing.success || !existing.data) return createErrorResult('GET_CONTENT_ERROR')
        const liked = (existing.data.likedByAccountIds ?? []).filter(id => id !== accountId)
        const updated: Story = { ...existing.data, likedByAccountIds: liked, updatedAt: new Date() }
        const result = await storyStore.update(storyId, updated)
        return result.success ? createSuccessResult(updated) : createErrorResult('SAVE_CONTENT_ERROR')
      } catch (error: any) {
        return createErrorResult('SAVE_CONTENT_ERROR', { originalError: error.message })
      }
    },
  }
}

function deduplicateByAccount(stories: Story[]): Story[] {
  const byAccount = new Map<string, Story>()
  for (const story of stories) {
    const existing = byAccount.get(story.accountId)
    if (!existing || story.updatedAt > existing.updatedAt) {
      byAccount.set(story.accountId, story)
    }
  }
  return [...byAccount.values()]
}

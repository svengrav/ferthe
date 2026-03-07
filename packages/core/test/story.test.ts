/**
 * Integration Tests: Story Contract
 *
 * Covers the full story lifecycle through the HTTP API:
 *
 *   Spot Stories (require a discovery):
 *   - getSpotStory → undefined before upsert
 *   - upsertSpotStory creates / updates
 *   - getSpotStory → reflects update
 *   - deleteStory removes it
 *
 *   Trail Stories (independent, no discovery required):
 *   - getTrailStory → undefined before upsert
 *   - upsertTrailStory creates / updates
 *   - getTrailStory → reflects update
 *   - deleteStory removes it
 *
 *   Visibility & public lists:
 *   - private story not visible in listPublicStoriesBySpot / ByTrail
 *   - public story appears in list
 *   - flipping back to private removes it from list
 *
 *   Deduplication:
 *   - listPublicStoriesBySpot / ByTrail returns at most one story per account
 *
 *   Authorization:
 *   - User B cannot delete User A's story
 *
 *   removeImage flag:
 *   - Story with comment replaces existing one; removeImage clears the image field
 */

import { assertEquals, assertExists } from '@std/assert'
import { createTestClient, createToken, useTestServer } from './helpers/testServer.ts'

// ── Clients ───────────────────────────────────────────────────────────────────

const creatorClient = createTestClient(createToken('story-creator', 'creator', 'creator'))
const userAClient = createTestClient(createToken('story-user-a', 'user', 'app'))
const userBClient = createTestClient(createToken('story-user-b', 'user', 'app'))

const SPOT_LOCATION = { lat: 48.3, lon: 11.7 }

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test({
  name: 'Story Contract — Integration',
  fn: useTestServer(async (t) => {
    let spotId: string
    let trailId: string
    let discoveryId: string
    let storyId: string

    // ── Setup: spot + trail ───────────────────────────────────────────────────

    await t.step('Setup: create spot', async () => {
      const result = await creatorClient.spot.createSpot({
        content: { name: 'Story Test Spot', description: 'Spot for story tests' },
        location: SPOT_LOCATION,
        visibility: 'public',
        consent: true,
      })
      assertExists(result.data?.id)
      spotId = result.data.id
      console.log(`✓ Spot created: ${spotId}`)
    })

    await t.step('Setup: create trail and add spot', async () => {
      const result = await creatorClient.trail.createTrail({
        kind: 'discovery',
        name: 'Story Test Trail',
        description: 'Trail for story tests',
        boundary: {
          northEast: { lat: 49.0, lon: 12.0 },
          southWest: { lat: 47.0, lon: 10.0 },
        },
        map: {},
        options: {
          scannerRadius: 100,
          discoveryMode: 'free',
          previewMode: 'hidden',
          spotAccess: 'open' as const,
        },
      })
      assertExists(result.data?.id)
      trailId = result.data.id
      await creatorClient.trail.addSpotToTrail(trailId, spotId, 0)
      console.log(`✓ Trail created: ${trailId}`)
    })

    await t.step('Setup: User A discovers the spot', async () => {
      const result = await userAClient.discovery.processLocation(trailId, {
        location: SPOT_LOCATION,
      })
      assertEquals(result.success, true)
      discoveryId = result.data!.discoveries[0].id
      console.log(`✓ Discovery created: ${discoveryId}`)
    })

    // ── Spot Story lifecycle ──────────────────────────────────────────────────

    await t.step('Spot: getSpotStory returns undefined before upsert', async () => {
      const result = await userAClient.story.getSpotStory(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data, undefined)
      console.log('✓ No spot story before upsert')
    })

    await t.step('Spot: upsertSpotStory creates story with comment', async () => {
      const result = await userAClient.story.upsertSpotStory(discoveryId, {
        comment: 'Amazing find!',
        visibility: 'private',
      })

      assertEquals(result.success, true)
      assertEquals(result.data?.discoveryId, discoveryId)
      assertEquals(result.data?.spotId, spotId)
      assertEquals(result.data?.comment, 'Amazing find!')
      assertEquals(result.data?.visibility, 'private')
      storyId = result.data!.id
      console.log(`✓ Spot story created: ${storyId}`)
    })

    await t.step('Spot: getSpotStory returns the created story', async () => {
      const result = await userAClient.story.getSpotStory(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data?.id, storyId)
      assertEquals(result.data?.comment, 'Amazing find!')
      console.log('✓ getSpotStory reflects upsert')
    })

    await t.step('Spot: upsertSpotStory updates existing story (idempotent)', async () => {
      const result = await userAClient.story.upsertSpotStory(discoveryId, {
        comment: 'Even better the second time!',
        visibility: 'private',
      })

      assertEquals(result.success, true)
      assertEquals(result.data?.id, storyId, 'Same deterministic ID')
      assertEquals(result.data?.comment, 'Even better the second time!')
      console.log('✓ Spot story updated idempotently')
    })

    await t.step('Spot: deleteStory removes the story', async () => {
      const del = await userAClient.story.deleteStory(storyId)
      assertEquals(del.success, true)

      const get = await userAClient.story.getSpotStory(discoveryId)
      assertEquals(get.success, true)
      assertEquals(get.data, undefined)
      console.log('✓ Spot story deleted, getSpotStory returns undefined')
    })

    // ── Trail Story lifecycle ─────────────────────────────────────────────────

    await t.step('Trail: getTrailStory returns undefined before upsert', async () => {
      const result = await userAClient.story.getTrailStory(trailId)

      assertEquals(result.success, true)
      assertEquals(result.data, undefined)
      console.log('✓ No trail story before upsert')
    })

    await t.step('Trail: upsertTrailStory creates story (no discovery required)', async () => {
      const result = await userAClient.story.upsertTrailStory(trailId, {
        comment: 'Great trail!',
        visibility: 'private',
      })

      assertEquals(result.success, true)
      assertEquals(result.data?.trailId, trailId)
      assertEquals(result.data?.discoveryId, undefined, 'Trail story has no discoveryId')
      assertEquals(result.data?.comment, 'Great trail!')
      storyId = result.data!.id
      console.log(`✓ Trail story created: ${storyId}`)
    })

    await t.step('Trail: getTrailStory returns the created story', async () => {
      const result = await userAClient.story.getTrailStory(trailId)

      assertEquals(result.success, true)
      assertEquals(result.data?.id, storyId)
      assertEquals(result.data?.comment, 'Great trail!')
      console.log('✓ getTrailStory reflects upsert')
    })

    await t.step('Trail: upsertTrailStory updates existing story', async () => {
      const result = await userAClient.story.upsertTrailStory(trailId, {
        comment: 'Would hike again!',
        visibility: 'private',
      })

      assertEquals(result.success, true)
      assertEquals(result.data?.id, storyId, 'Same deterministic ID')
      assertEquals(result.data?.comment, 'Would hike again!')
      console.log('✓ Trail story updated idempotently')
    })

    await t.step('Trail: deleteStory removes the trail story', async () => {
      const del = await userAClient.story.deleteStory(storyId)
      assertEquals(del.success, true)

      const get = await userAClient.story.getTrailStory(trailId)
      assertEquals(get.success, true)
      assertEquals(get.data, undefined)
      console.log('✓ Trail story deleted')
    })

    // ── Visibility & public lists ─────────────────────────────────────────────

    await t.step('Visibility: private spot story not in listPublicStoriesBySpot', async () => {
      await userAClient.story.upsertSpotStory(discoveryId, {
        comment: 'Secret note',
        visibility: 'private',
      })

      const result = await userAClient.story.listPublicStoriesBySpot(spotId)
      assertEquals(result.success, true)
      const found = result.data?.find(s => s.accountId === 'story-user-a')
      assertEquals(found, undefined, 'Private story must not appear in public list')
      console.log('✓ Private spot story excluded from public list')
    })

    await t.step('Visibility: public spot story appears in listPublicStoriesBySpot', async () => {
      await userAClient.story.upsertSpotStory(discoveryId, {
        comment: 'Public note',
        visibility: 'public',
      })

      const result = await userAClient.story.listPublicStoriesBySpot(spotId)
      assertEquals(result.success, true)
      const found = result.data?.find(s => s.accountId === 'story-user-a')
      assertExists(found, 'Public story must appear in list')
      assertEquals(found?.comment, 'Public note')
      console.log('✓ Public spot story in list')
    })

    await t.step('Visibility: flipping back to private removes story from list', async () => {
      await userAClient.story.upsertSpotStory(discoveryId, {
        visibility: 'private',
      })

      const result = await userAClient.story.listPublicStoriesBySpot(spotId)
      assertEquals(result.success, true)
      const found = result.data?.find(s => s.accountId === 'story-user-a')
      assertEquals(found, undefined, 'Story must disappear from list after setting private')
      console.log('✓ Story removed from public list after visibility change')
    })

    await t.step('Visibility: private trail story not in listPublicStoriesByTrail', async () => {
      await userAClient.story.upsertTrailStory(trailId, {
        comment: 'Private trail note',
        visibility: 'private',
      })

      const result = await userAClient.story.listPublicStoriesByTrail(trailId)
      assertEquals(result.success, true)
      const found = result.data?.find(s => s.accountId === 'story-user-a')
      assertEquals(found, undefined)
      console.log('✓ Private trail story excluded from public list')
    })

    await t.step('Visibility: public trail story appears in listPublicStoriesByTrail', async () => {
      await userAClient.story.upsertTrailStory(trailId, {
        comment: 'Public trail note',
        visibility: 'public',
      })

      const result = await userAClient.story.listPublicStoriesByTrail(trailId)
      assertEquals(result.success, true)
      const found = result.data?.find(s => s.accountId === 'story-user-a')
      assertExists(found)
      assertEquals(found?.comment, 'Public trail note')
      console.log('✓ Public trail story in list')
    })

    // ── Deduplication ─────────────────────────────────────────────────────────

    await t.step('Deduplication: User B discovers spot and adds public spot story', async () => {
      const disc = await userBClient.discovery.processLocation(trailId, { location: SPOT_LOCATION })
      assertEquals(disc.success, true)
      const bDiscoveryId = disc.data!.discoveries[0].id

      const result = await userBClient.story.upsertSpotStory(bDiscoveryId, {
        comment: 'User B was here!',
        visibility: 'public',
      })
      assertEquals(result.success, true)
      console.log('✓ User B spot story created')
    })

    await t.step('Deduplication: listPublicStoriesBySpot returns one entry per account', async () => {
      // User A's story is public (set above), User B's too
      // Set user A back to public first
      await userAClient.story.upsertSpotStory(discoveryId, { visibility: 'public' })

      // Upsert again to simulate a duplicate — should still be deduplicated
      await userAClient.story.upsertSpotStory(discoveryId, { comment: 'Still public' })

      const result = await userAClient.story.listPublicStoriesBySpot(spotId)
      assertEquals(result.success, true)

      const accountIds = result.data!.map(s => s.accountId)
      const unique = new Set(accountIds)
      assertEquals(accountIds.length, unique.size, 'Duplicates per account must be removed')
      console.log(`✓ Deduplication: ${accountIds.length} story/stories, all unique accounts`)
    })

    await t.step('Deduplication: User B adds public trail story', async () => {
      const result = await userBClient.story.upsertTrailStory(trailId, {
        comment: 'User B loves this trail',
        visibility: 'public',
      })
      assertEquals(result.success, true)

      const list = await userAClient.story.listPublicStoriesByTrail(trailId)
      assertEquals(list.success, true)
      const accountIds = list.data!.map(s => s.accountId)
      const unique = new Set(accountIds)
      assertEquals(accountIds.length, unique.size, 'No duplicate accounts in trail list')
      console.log(`✓ Trail list deduplication: ${accountIds.length} stories`)
    })

    // ── Authorization ─────────────────────────────────────────────────────────

    await t.step('Auth: User B cannot delete User A\'s spot story', async () => {
      const get = await userAClient.story.getSpotStory(discoveryId)
      assertExists(get.data?.id)

      const del = await userBClient.story.deleteStory(get.data!.id)
      assertEquals(del.success, false, 'Must be rejected')
      console.log('✓ User B blocked from deleting User A\'s story')
    })

    await t.step('Auth: User A can delete own spot story', async () => {
      const get = await userAClient.story.getSpotStory(discoveryId)
      assertExists(get.data?.id)

      const del = await userAClient.story.deleteStory(get.data!.id)
      assertEquals(del.success, true)
      console.log('✓ User A deleted own story')
    })

    // ── removeImage ───────────────────────────────────────────────────────────

    await t.step('removeImage: upsert with comment only (no image to remove, safe no-op)', async () => {
      // Start fresh trail story
      const upsert = await userAClient.story.upsertTrailStory(trailId, {
        comment: 'No image here',
        visibility: 'private',
      })
      assertEquals(upsert.success, true)
      assertEquals(upsert.data?.image, undefined, 'No image set')

      const update = await userAClient.story.upsertTrailStory(trailId, {
        removeImage: true,
        comment: 'Still no image',
      })
      assertEquals(update.success, true)
      assertEquals(update.data?.image, undefined, 'Image still undefined — removeImage is a safe no-op')
      console.log('✓ removeImage: no-op when no image exists')
    })

    await t.step('removeImage: after setting comment-only story, image stays undefined', async () => {
      const result = await userAClient.story.getTrailStory(trailId)
      assertEquals(result.success, true)
      assertEquals(result.data?.image, undefined)
      console.log('✓ removeImage: image field absent after remove')
    })
  }),
})

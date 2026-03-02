/**
 * Integration Tests: Discovery Contract
 *
 * Covers the full discovery lifecycle through the HTTP API:
 *
 *   - Profile: get / update
 *   - Preview clues visible before discovery
 *   - processLocation triggers a discovery
 *   - list / get single discovery
 *   - listSpots returns discovered spots (cross-account, not just own)
 *   - getStats returns ranked stats per discovery
 *   - Content: upsert / get / delete
 *   - getDiscoveryState (composite) includes discovered spots
 *   - getDiscoveryState only returns own discoveries, not another user's
 */

import { assertEquals, assertExists } from '@std/assert'
import { createTestClient, createToken, useTestServer } from './helpers/testServer.ts'

// ── Clients ───────────────────────────────────────────────────────────────────

// Creator sets up spot + trail
const creatorClient = createTestClient(createToken('discovery-creator', 'creator', 'creator'))

// Two independent users
const userAClient = createTestClient(createToken('discovery-user-a', 'user', 'app'))
const userBClient = createTestClient(createToken('discovery-user-b', 'user', 'app'))

// ── Spot location ─────────────────────────────────────────────────────────────

const SPOT_LOCATION = { lat: 48.1, lon: 11.5 }

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test({
  name: 'Discovery Contract — Integration',
  fn: useTestServer(async (t) => {
    let spotId: string
    let trailId: string
    let discoveryId: string

    // ── Setup ─────────────────────────────────────────────────────────────────

    await t.step('Setup: create spot as creator', async () => {
      const result = await creatorClient.spots.create({
        content: { name: 'Discovery Spot', description: 'Found it!' },
        location: SPOT_LOCATION,
        visibility: 'public',
        consent: true,
      })

      assertExists(result.data?.id)
      spotId = result.data.id
      console.log(`✓ Spot created: ${spotId}`)
    })

    await t.step('Setup: create trail and add spot', async () => {
      const result = await creatorClient.trails.create({
        name: 'Discovery Trail',
        description: 'Trail for discovery tests',
        boundary: {
          northEast: { lat: 49.0, lon: 12.0 },
          southWest: { lat: 47.0, lon: 10.0 },
        },
        map: {},
        options: {
          scannerRadius: 100,
          discoveryMode: 'free',
          previewMode: 'hidden',
        },
      })

      assertExists(result.data?.id)
      trailId = result.data.id

      await creatorClient.trails.addSpot(trailId, spotId, 0)
      console.log(`✓ Trail created: ${trailId}, spot added`)
    })

    // ── Profile ───────────────────────────────────────────────────────────────

    await t.step('getProfile returns a default discovery profile', async () => {
      const result = await userAClient.discovery.getProfile()

      assertEquals(result.success, true)
      assertExists(result.data, 'Profile must exist')
      console.log('✓ Default profile returned')
    })

    await t.step('updateProfile persists lastActiveTrailId', async () => {
      const result = await userAClient.discovery.updateProfile({ lastActiveTrailId: trailId })

      assertEquals(result.success, true)
      assertEquals(result.data?.lastActiveTrailId, trailId)
      console.log('✓ Profile updated with active trail')
    })

    // ── Pre-discovery state ───────────────────────────────────────────────────

    await t.step('list returns empty before any discovery', async () => {
      const result = await userAClient.discovery.list()

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 0, 'No discoveries yet')
      console.log('✓ Empty discovery list before processLocation')
    })

    await t.step('listSpots returns empty before any discovery', async () => {
      const result = await userAClient.discovery.listSpots()

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 0, 'No discovered spots yet')
      console.log('✓ Empty discovered spots list before processLocation')
    })

    await t.step('getDiscoveryState returns no discoveries and no discovered spots before processLocation', async () => {
      const result = await userAClient.composite.getDiscoveryState()

      assertEquals(result.success, true)
      assertEquals(result.data?.discoveries.length, 0, 'No discoveries in state yet')
      // spots may contain creator-owned spots from other tests but not this user's discovery spots
      const discoveredByA = result.data?.spots.filter(s => s.source === 'discovery') ?? []
      assertEquals(discoveredByA.length, 0, 'No discovery-source spots in state yet')
      console.log('✓ Discovery state empty before processLocation')
    })

    await t.step('listPreviewClues returns clues for the trail', async () => {
      const result = await userAClient.discovery.listPreviewClues(trailId)

      assertEquals(result.success, true)
      assertExists(result.data, 'Clues array must exist')
      console.log(`✓ Preview clues returned (${result.data?.length} clue/s)`)
    })

    // ── Trigger discovery ─────────────────────────────────────────────────────

    await t.step('processLocation at spot position creates a discovery', async () => {
      const result = await userAClient.discovery.processLocation(trailId, {
        location: SPOT_LOCATION,
      })

      assertEquals(result.success, true)
      assertExists(result.data?.discoveries, 'discoveries array must be present')
      assertEquals(result.data!.discoveries.length >= 1, true, 'At least one discovery created')

      discoveryId = result.data!.discoveries[0].id
      console.log(`✓ Discovery created: ${discoveryId}`)
    })

    // ── Discovery list / get ──────────────────────────────────────────────────

    await t.step('list returns the new discovery', async () => {
      const result = await userAClient.discovery.list()

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 1)
      assertEquals(result.data?.[0].id, discoveryId)
      assertEquals(result.data?.[0].spotId, spotId)
      console.log('✓ Discovery appears in list')
    })

    await t.step('list filtered by trailId returns the discovery', async () => {
      const result = await userAClient.discovery.list({ trailId })

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 1)
      assertEquals(result.data?.[0].trailId, trailId)
      console.log('✓ Filtered list by trailId works')
    })

    await t.step('get returns the single discovery by id', async () => {
      const result = await userAClient.discovery.get(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data?.id, discoveryId)
      assertEquals(result.data?.spotId, spotId)
      console.log('✓ get() returns correct discovery')
    })

    // ── Discovered spots ──────────────────────────────────────────────────────

    await t.step('listSpots returns the discovered spot with correct source', async () => {
      const result = await userAClient.discovery.listSpots()

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 1)
      assertEquals(result.data?.[0].id, spotId)
      assertEquals(result.data?.[0].source, 'discovery', 'Source must be "discovery" for cross-account spot')
      console.log('✓ listSpots returns discovered spot with source=discovery')
    })

    await t.step('listSpots filtered by trailId returns the spot', async () => {
      const result = await userAClient.discovery.listSpots({ trailId })

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 1)
      assertEquals(result.data?.[0].id, spotId)
      console.log('✓ listSpots filtered by trailId works')
    })

    // ── Discovery state (composite) ───────────────────────────────────────────

    await t.step('getDiscoveryState includes discovery and discovered spot after processLocation', async () => {
      const result = await userAClient.composite.getDiscoveryState()

      assertEquals(result.success, true)
      assertEquals(result.data?.discoveries.length, 1, 'One discovery in state')
      assertEquals(result.data?.discoveries[0].spotId, spotId)

      const discoveredSpot = result.data?.spots.find(s => s.id === spotId)
      assertExists(discoveredSpot, 'Discovered spot must appear in state spots')
      assertEquals(discoveredSpot?.source, 'discovery', 'Source must be "discovery"')
      console.log('✓ getDiscoveryState includes discovered spot (regression: source=discovery)')
    })

    await t.step('getDiscoveryState for user B is empty (discoveries are per account)', async () => {
      const result = await userBClient.composite.getDiscoveryState()

      assertEquals(result.success, true)
      assertEquals(result.data?.discoveries.length, 0, 'User B has no discoveries')
      const spotFromUserA = result.data?.spots.find(s => s.id === spotId)
      assertEquals(spotFromUserA, undefined, 'User B must not see user A\'s discovered spot')
      console.log('✓ Discovery state is isolated per account')
    })

    // ── Discovery trail ───────────────────────────────────────────────────────

    await t.step('getTrail returns trail with discovered spot and discovery', async () => {
      const result = await userAClient.discovery.getTrail(trailId)

      assertEquals(result.success, true)
      assertExists(result.data?.spots, 'Trail must contain spots')
      assertExists(result.data?.discoveries, 'Trail must contain discoveries')

      const discoveredSpot = result.data?.spots.find(s => s.id === spotId)
      assertExists(discoveredSpot, 'Discovered spot must appear in trail')
      console.log('✓ getTrail returns trail with discovery data')
    })

    // ── Stats ─────────────────────────────────────────────────────────────────

    await t.step('getStats returns ranked stats for the discovery', async () => {
      const result = await userAClient.discovery.getStats(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data?.discoveryId, discoveryId)
      assertExists(result.data?.rank, 'Rank must be present')
      assertExists(result.data?.totalDiscoverers, 'totalDiscoverers must be present')
      assertEquals(result.data!.totalDiscoverers >= 1, true, 'At least one discoverer')
      console.log(`✓ Stats: rank=${result.data?.rank}, total=${result.data?.totalDiscoverers}`)
    })

    // ── Content lifecycle ─────────────────────────────────────────────────────

    await t.step('getContent returns undefined before upsert', async () => {
      const result = await userAClient.discovery.getContent(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data, undefined, 'No content before upsert')
      console.log('✓ No content before upsert')
    })

    await t.step('upsertContent creates content with comment', async () => {
      const result = await userAClient.discovery.upsertContent(discoveryId, {
        comment: 'Amazing spot!',
        visibility: 'public',
      })

      assertEquals(result.success, true)
      assertEquals(result.data?.discoveryId, discoveryId)
      assertEquals(result.data?.comment, 'Amazing spot!')
      assertEquals(result.data?.visibility, 'public')
      console.log('✓ Content created via upsert')
    })

    await t.step('upsertContent updates existing content', async () => {
      const result = await userAClient.discovery.upsertContent(discoveryId, {
        comment: 'Updated comment',
        visibility: 'private',
      })

      assertEquals(result.success, true)
      assertEquals(result.data?.comment, 'Updated comment')
      assertEquals(result.data?.visibility, 'private')
      console.log('✓ Content updated via upsert (idempotent)')
    })

    await t.step('getContent returns updated content', async () => {
      const result = await userAClient.discovery.getContent(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data?.comment, 'Updated comment')
      assertEquals(result.data?.visibility, 'private')
      console.log('✓ getContent reflects update')
    })

    await t.step('deleteContent removes the content', async () => {
      const result = await userAClient.discovery.deleteContent(discoveryId)

      assertEquals(result.success, true)
      console.log('✓ Content deleted')
    })

    await t.step('getContent returns undefined after delete', async () => {
      const result = await userAClient.discovery.getContent(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data, undefined, 'Content must be gone after delete')
      console.log('✓ Content no longer present after delete')
    })
  }),
  sanitizeResources: false,
  sanitizeOps: false,
})

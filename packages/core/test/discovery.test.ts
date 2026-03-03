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
      const result = await creatorClient.spot.createSpot({
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
      const result = await creatorClient.trail.createTrail({
        kind: 'discovery',
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

      await creatorClient.trail.addSpotToTrail(trailId, spotId, 0)
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
      const result = await userAClient.discovery.listDiscoveries()

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 0, 'No discoveries yet')
      console.log('✓ Empty discovery list before processLocation')
    })

    await t.step('listSpots returns empty before any discovery', async () => {
      const result = await userAClient.discovery.listDiscoveredSpots()

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
      const result = await userAClient.discovery.listDiscoveries()

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 1)
      assertEquals(result.data?.[0].id, discoveryId)
      assertEquals(result.data?.[0].spotId, spotId)
      console.log('✓ Discovery appears in list')
    })

    await t.step('list filtered by trailId returns the discovery', async () => {
      const result = await userAClient.discovery.listDiscoveries({ trailId })

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 1)
      assertEquals(result.data?.[0].trailId, trailId)
      console.log('✓ Filtered list by trailId works')
    })

    await t.step('get returns the single discovery by id', async () => {
      const result = await userAClient.discovery.getDiscovery(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data?.id, discoveryId)
      assertEquals(result.data?.spotId, spotId)
      console.log('✓ get() returns correct discovery')
    })

    // ── Discovered spots ──────────────────────────────────────────────────────

    await t.step('listSpots returns the discovered spot with correct source', async () => {
      const result = await userAClient.discovery.listDiscoveredSpots()

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 1)
      assertEquals(result.data?.[0].id, spotId)
      assertEquals(result.data?.[0].source, 'discovery', 'Source must be "discovery" for cross-account spot')
      console.log('✓ listSpots returns discovered spot with source=discovery')
    })

    await t.step('listSpots filtered by trailId returns the spot', async () => {
      const result = await userAClient.discovery.listDiscoveredSpots({ trailId })

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
      const result = await userAClient.discovery.getDiscoveryTrail(trailId)

      assertEquals(result.success, true)
      assertExists(result.data?.spots, 'Trail must contain spots')
      assertExists(result.data?.discoveries, 'Trail must contain discoveries')

      const discoveredSpot = result.data?.spots.find(s => s.id === spotId)
      assertExists(discoveredSpot, 'Discovered spot must appear in trail')
      console.log('✓ getTrail returns trail with discovery data')
    })

    // ── Stats ─────────────────────────────────────────────────────────────────

    await t.step('getStats returns ranked stats for the discovery', async () => {
      const result = await userAClient.discovery.getDiscoveryStats(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data?.discoveryId, discoveryId)
      assertExists(result.data?.rank, 'Rank must be present')
      assertExists(result.data?.totalDiscoverers, 'totalDiscoverers must be present')
      assertEquals(result.data!.totalDiscoverers >= 1, true, 'At least one discoverer')
      console.log(`✓ Stats: rank=${result.data?.rank}, total=${result.data?.totalDiscoverers}`)
    })

    await t.step('getStats: rank=1 as first discoverer, trailPosition=1, trailTotal=1', async () => {
      const result = await userAClient.discovery.getDiscoveryStats(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data?.rank, 1, 'User A is the first (and only) discoverer → rank 1')
      assertEquals(result.data?.totalDiscoverers, 1, 'Only one discoverer so far')
      assertEquals(result.data?.trailPosition, 1, 'First spot discovered in this trail → position 1')
      assertEquals(result.data?.trailTotal, 1, 'Trail has exactly 1 spot')
      console.log(`✓ rank=1, trailPosition=1/1`)
    })

    await t.step('getStats: user B discovers same spot → user A rank stays 1, user B rank=2', async () => {
      // User B discovers the same spot
      const discoverResult = await userBClient.discovery.processLocation(trailId, {
        location: SPOT_LOCATION,
      })
      assertEquals(discoverResult.success, true)
      const userBDiscoveryId = discoverResult.data!.discoveries[0].id

      // User A should now be rank 1 (discovered first)
      const statsA = await userAClient.discovery.getDiscoveryStats(discoveryId)
      assertEquals(statsA.data?.rank, 1, 'User A stays rank 1 (discovered first)')
      assertEquals(statsA.data?.totalDiscoverers, 2, 'Now 2 discoverers')

      // User B should be rank 2 (discovered second)
      const statsB = await userBClient.discovery.getDiscoveryStats(userBDiscoveryId)
      assertEquals(statsB.data?.rank, 2, 'User B is rank 2 (discovered second)')
      assertEquals(statsB.data?.totalDiscoverers, 2, 'Also sees 2 discoverers')
      assertEquals(statsB.data?.trailPosition, 1, 'User B also at trail position 1')

      console.log(`✓ rank ordering correct after second discoverer`)
    })

    // ── Content lifecycle ─────────────────────────────────────────────────────

    await t.step('getContent returns undefined before upsert', async () => {
      const result = await userAClient.discovery.getDiscoveryContent(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data, undefined, 'No content before upsert')
      console.log('✓ No content before upsert')
    })

    await t.step('upsertContent creates content with comment', async () => {
      const result = await userAClient.discovery.upsertDiscoveryContent(discoveryId, {
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
      const result = await userAClient.discovery.upsertDiscoveryContent(discoveryId, {
        comment: 'Updated comment',
        visibility: 'private',
      })

      assertEquals(result.success, true)
      assertEquals(result.data?.comment, 'Updated comment')
      assertEquals(result.data?.visibility, 'private')
      console.log('✓ Content updated via upsert (idempotent)')
    })

    await t.step('getContent returns updated content', async () => {
      const result = await userAClient.discovery.getDiscoveryContent(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data?.comment, 'Updated comment')
      assertEquals(result.data?.visibility, 'private')
      console.log('✓ getContent reflects update')
    })

    await t.step('deleteContent removes the content', async () => {
      const result = await userAClient.discovery.deleteDiscoveryContent(discoveryId)

      assertEquals(result.success, true)
      console.log('✓ Content deleted')
    })

    await t.step('getContent returns undefined after delete', async () => {
      const result = await userAClient.discovery.getDiscoveryContent(discoveryId)

      assertEquals(result.success, true)
      assertEquals(result.data, undefined, 'Content must be gone after delete')
      console.log('✓ Content no longer present after delete')
    })
  }),
  sanitizeResources: false,
  sanitizeOps: false,
})

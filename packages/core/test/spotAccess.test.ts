/**
 * Integration Tests: Spot Access Control
 *
 * Verifies that getAccessibleSpot (GET /spot/spots/:id) and
 * getAccessibleSpots (GET /composite/spots/accessible) enforce
 * discovery-based access rules correctly:
 *
 *   - Non-discovered spot → SpotPreview only (no name / location / description)
 *   - Discovered spot     → full Spot data
 *   - Admin + creator     → full Spot data (creator tool bypass)
 *   - Admin + app         → SpotPreview only (same discovery rules as user)
 *   - Own created spot    → always full Spot data
 */

import { assertEquals, assertExists } from '@std/assert'
import { createTestClient, createToken, useTestServer } from './helpers/testServer.ts'

// ── Clients ───────────────────────────────────────────────────────────────────

const creatorClient = createTestClient(createToken('test-creator', 'creator', 'creator'))
const userClient = createTestClient(createToken('test-user', 'user', 'app'))
const adminAppClient = createTestClient(createToken('test-admin-app', 'admin', 'app'))
const adminCreatorClient = createTestClient(createToken('test-admin-creator', 'admin', 'creator'))

// ── Spot location ─────────────────────────────────────────────────────────────

// User will scan from the exact same location → distance = 0, within discoveryRadius
const SPOT_LOCATION = { lat: 51.5, lon: 7.5 }

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test({
  name: 'Spot Access Control — Integration',
  fn: useTestServer(async (t) => {
    let spotId: string
    let trailId: string

    // ── Setup ─────────────────────────────────────────────────────────────────

    await t.step('Setup: create spot as creator', async () => {
      const result = await creatorClient.spots.create({
        content: { name: 'Hidden Spot', description: 'A spot to discover' },
        location: SPOT_LOCATION,
        visibility: 'public',
        consent: true,
      })

      assertExists(result.data?.id)
      spotId = result.data.id
      console.log(`   ✓ Spot created: ${spotId}`)
    })

    await t.step('Setup: create trail and add spot', async () => {
      const result = await creatorClient.trails.create({
        name: 'Test Trail',
        description: 'Trail for access control tests',
        boundary: {
          northEast: { lat: 52.0, lon: 8.0 },
          southWest: { lat: 51.0, lon: 7.0 },
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

      console.log(`   ✓ Trail created: ${trailId}, spot added`)
    })

    // ── Access control: before discovery ──────────────────────────────────────

    await t.step('1. Regular user gets error for undiscovered spot', async () => {
      const result = await userClient.spots.get(spotId)

      assertEquals(result.success, false, 'Undiscovered spot must return error')
      assertEquals(result.error?.code, 'DISCOVERY_REQUIRED', 'Error code must be DISCOVERY_REQUIRED')
      console.log('   ✓ User gets DISCOVERY_REQUIRED error (use preview endpoint instead)')
    })

    await t.step('1b. Public preview endpoint always returns preview data', async () => {
      const result = await userClient.spots.getPreview(spotId)

      assertExists(result.data?.id, 'Preview must contain id')
      assertExists(result.data?.rating, 'Preview must contain rating summary')
      assertEquals(result.data?.blurredImage, undefined, 'No blurred image uploaded')
      console.log('   ✓ getPreview() returns SpotPreview for any user')
    })

    await t.step('2. Admin + creator client sees full spot without any discovery', async () => {
      const result = await adminCreatorClient.spots.get(spotId)

      assertEquals(result.success, true, 'Admin+creator must have access')
      assertEquals(result.data?.name, 'Hidden Spot', 'Admin+creator must see full spot name')
      assertExists(result.data?.location, 'Admin+creator must see location')
      console.log('   ✓ Admin+creator sees full Spot (creator bypass active)')
    })

    await t.step('3. Admin + app client gets error (follows discovery rules)', async () => {
      const result = await adminAppClient.spots.get(spotId)

      assertEquals(result.success, false, 'Admin+app must get error without discovery')
      assertEquals(result.error?.code, 'DISCOVERY_REQUIRED', 'Error code must be DISCOVERY_REQUIRED')
      console.log('   ✓ Admin+app gets DISCOVERY_REQUIRED error (no creator bypass for app client)')
    })

    await t.step('4. Creator of the spot always sees own spot in full', async () => {
      const result = await creatorClient.spots.get(spotId)

      assertEquals(result.success, true, 'Creator must have access to own spot')
      assertEquals(result.data?.name, 'Hidden Spot', 'Creator must always see own spot in full')
      console.log('   ✓ Creator sees own spot in full (ownership bypass)')
    })

    await t.step('5. User has no accessible spots before discovery', async () => {
      const result = await userClient.composite.listAccessibleSpots({ trailId })

      assertEquals(result.data?.length, 0, 'No spots accessible before discovery')
      console.log('   ✓ Accessible spots list is empty before discovery')
    })

    // ── Trigger discovery ─────────────────────────────────────────────────────

    await t.step('6. User triggers discovery via processLocation at spot position', async () => {
      const result = await userClient.discovery.processLocation(trailId, { location: SPOT_LOCATION })

      assertExists(result.data?.discoveries, 'Response must contain discoveries array')
      assertEquals(result.data.discoveries.length >= 1, true, 'At least one discovery must have been created')
      console.log(`   ✓ Discovery created (${result.data.discoveries.length} discovery/discoveries)`)
    })

    // ── Access control: after discovery ───────────────────────────────────────

    await t.step('7. User sees full spot after discovery', async () => {
      const result = await userClient.spots.get(spotId)

      assertEquals(result.success, true, 'User must have access after discovery')
      assertEquals(result.data?.name, 'Hidden Spot', 'Discovered spot must expose full name')
      assertExists(result.data?.location, 'Discovered spot must expose location')
      assertExists(result.data?.description, 'Discovered spot must expose description')
      console.log('   ✓ User sees full Spot after discovery')
    })

    await t.step('8. Accessible spots list contains spot after discovery', async () => {
      const result = await userClient.composite.listAccessibleSpots({ trailId })

      assertEquals(result.data?.length, 1, 'One spot accessible after discovery')
      assertEquals(result.data?.[0]?.name, 'Hidden Spot')
      console.log('   ✓ Accessible spots list returns discovered spot')
    })

    // ── Admin + app is still gated ────────────────────────────────────────────

    await t.step('9. Admin + app still gets error (has no discovery)', async () => {
      const result = await adminAppClient.spots.get(spotId)

      assertEquals(result.success, false, 'Admin+app (no discovery) must get error')
      assertEquals(result.error?.code, 'DISCOVERY_REQUIRED', 'Error code must be DISCOVERY_REQUIRED')
      console.log('   ✓ Admin+app gets DISCOVERY_REQUIRED error (no discovery for that account)')
    })
  }),
  sanitizeResources: false,
  sanitizeOps: false,
})

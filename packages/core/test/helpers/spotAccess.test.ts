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
import { createTestClient, createToken, useTestServer } from './testServer.ts'

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
      const spot = await creatorClient.spots.create({
        content: { name: 'Hidden Spot', description: 'A spot to discover' },
        location: SPOT_LOCATION,
        visibility: 'public',
        consent: true,
      })

      assertExists(spot?.id)
      spotId = spot.id
      console.log(`   ✓ Spot created: ${spotId}`)
    })

    await t.step('Setup: create trail and add spot', async () => {
      const trail = await creatorClient.trails.create({
        name: 'Test Trail',
        description: 'Trail for access control tests',
        boundary: null,
        map: {},
        options: {
          scannerRadius: 100,
          discoveryMode: 'free',
          previewMode: 'hidden',
        },
      })

      assertExists(trail?.id)
      trailId = trail.id

      await creatorClient.trails.addSpot({ trailId, spotId, order: 0 })

      console.log(`   ✓ Trail created: ${trailId}, spot added`)
    })

    // ── Access control: before discovery ──────────────────────────────────────

    await t.step('1. Regular user sees only preview for undiscovered spot', async () => {
      const spot = await userClient.spots.get({ id: spotId })

      assertEquals(spot?.name, undefined, 'Undiscovered spot must not expose name')
      assertEquals(spot?.description, undefined, 'Undiscovered spot must not expose description')
      assertEquals(spot?.location, undefined, 'Undiscovered spot must not expose location')
      assertExists(spot?.id, 'Preview must contain id')
      console.log('   ✓ User sees SpotPreview only (no name/location/description)')
    })

    await t.step('2. Admin + creator client sees full spot without any discovery', async () => {
      const spot = await adminCreatorClient.spots.get({ id: spotId })

      assertEquals(spot?.name, 'Hidden Spot', 'Admin+creator must see full spot name')
      assertExists(spot?.location, 'Admin+creator must see location')
      console.log('   ✓ Admin+creator sees full Spot (creator bypass active)')
    })

    await t.step('3. Admin + app client sees only preview (follows discovery rules)', async () => {
      const spot = await adminAppClient.spots.get({ id: spotId })

      assertEquals(spot?.name, undefined, 'Admin+app must not expose name without discovery')
      assertEquals(spot?.location, undefined, 'Admin+app must not expose location without discovery')
      console.log('   ✓ Admin+app sees SpotPreview only (no creator bypass for app client)')
    })

    await t.step('4. Creator of the spot always sees own spot in full', async () => {
      const spot = await creatorClient.spots.get({ id: spotId })

      assertEquals(spot?.name, 'Hidden Spot', 'Creator must always see own spot in full')
      console.log('   ✓ Creator sees own spot in full (ownership bypass)')
    })

    await t.step('5. User has no accessible spots before discovery', async () => {
      const result = await userClient.composite.listAccessibleSpots({ trailId })

      assertEquals(result?.items?.length, 0, 'No spots accessible before discovery')
      console.log('   ✓ Accessible spots list is empty before discovery')
    })

    // ── Trigger discovery ─────────────────────────────────────────────────────

    await t.step('6. User triggers discovery via processLocation at spot position', async () => {
      const result = await userClient.discovery.processLocation({
        locationWithDirection: { location: SPOT_LOCATION },
        trailId,
      })

      assertExists(result?.discoveries, 'Response must contain discoveries array')
      assertEquals(result?.discoveries?.length >= 1, true, 'At least one discovery must have been created')
      console.log(`   ✓ Discovery created (${result.discoveries.length} discovery/discoveries)`)
    })

    // ── Access control: after discovery ───────────────────────────────────────

    await t.step('7. User sees full spot after discovery', async () => {
      const spot = await userClient.spots.get({ id: spotId })

      assertEquals(spot?.name, 'Hidden Spot', 'Discovered spot must expose full name')
      assertExists(spot?.location, 'Discovered spot must expose location')
      assertExists(spot?.description, 'Discovered spot must expose description')
      console.log('   ✓ User sees full Spot after discovery')
    })

    await t.step('8. Accessible spots list contains spot after discovery', async () => {
      const result = await userClient.composite.listAccessibleSpots({ trailId })

      assertEquals(result?.items?.length, 1, 'One spot accessible after discovery')
      assertEquals(result?.items?.[0]?.name, 'Hidden Spot')
      console.log('   ✓ Accessible spots list returns discovered spot')
    })

    // ── Admin + app is still gated ────────────────────────────────────────────

    await t.step('9. Admin + app still sees only preview (has no discovery)', async () => {
      const spot = await adminAppClient.spots.get({ id: spotId })

      assertEquals(spot?.name, undefined, 'Admin+app (no discovery) must still see only preview')
      console.log('   ✓ Admin+app sees preview only (no discovery for that account)')
    })
  }),
  sanitizeResources: false,
  sanitizeOps: false,
})

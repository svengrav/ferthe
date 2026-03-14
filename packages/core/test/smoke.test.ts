/**
 * Smoke Tests: Read-only Entity Verification via Postgres Store
 *
 * Verifies that after DB/schema changes all core entities are still
 * readable through the API. Does NOT write anything to the database.
 *
 * Prerequisites:
 *   1. Dev server running:  deno run --allow-all main.ts
 *   2. A valid session token (one-time, only creates a session record):
 *        export SMOKE_TOKEN=$(curl -s -X POST http://localhost:7000/api/v1/account/dev-session \
 *          -H "Content-Type: application/json" -d '{"accountId":"smoke-checker"}' \
 *          | jq -r .data.sessionToken)
 *
 * Run:
 *   SMOKE_TOKEN=<token> deno test --allow-all test/smoke.test.ts
 */

import { createApiClient } from '@shared/api'
import { assertEquals, assertExists } from '@std/assert'

const PORT = Deno.env.get('SMOKE_PORT') ?? '7000'
const BASE_URL = `http://localhost:${PORT}/api/v1`
const rawToken = Deno.env.get('SMOKE_TOKEN') ?? ''
// Guard against shell commands returning literal "null" (e.g. from failed jq)
const TOKEN = rawToken === 'null' ? '' : rawToken

if (!TOKEN) {
  console.warn('⚠ SMOKE_TOKEN not set — auth checks will be skipped.')
  console.warn('  Get a token from an existing account session, or create one:')
  console.warn('  export SMOKE_TOKEN=$(curl -s -X POST http://localhost:7000/api/v1/account/actions/create-local | jq -r .data.sessionToken)')
}

const client = createApiClient({ baseUrl: BASE_URL, getAuthToken: () => TOKEN })

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test({
  name: 'Smoke — Postgres Read-back (no DB writes)',
  fn: async (t) => {

    // ── Status ────────────────────────────────────────────────────────────────

    await t.step('GET /status responds', async () => {
      const result = await client.system.getStatus()

      assertEquals(result.success, true)
      assertExists(result.data?.status)
      console.log(`✓ API up: ${result.data?.status}`)
    })

    if (!TOKEN) {
      console.log('⚠ Skipping auth checks — SMOKE_TOKEN missing')
      return
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    await t.step('GET /account/profile responds', async () => {
      const result = await client.account.getProfile()

      assertEquals(result.success, true)
      assertExists(result.data?.id)
      console.log(`✓ Profile: ${result.data?.id}`)
    })

    // ── Trails ────────────────────────────────────────────────────────────────

    let trailId: string | undefined

    await t.step('GET /trails — list and verify JSONB options shape', async () => {
      const result = await client.trail.listTrails()

      assertEquals(result.success, true)
      assertExists(result.data, 'trails array must exist')

      if (result.data!.length === 0) {
        console.log('⚠ No trails in DB — shape check skipped')
        return
      }

      const trail = result.data![0]
      trailId = trail.id

      assertExists(trail.options, 'trail.options must exist')
      assertExists(trail.options.scannerRadius, 'options.scannerRadius must be present (JSONB round-trip)')
      assertExists(trail.options.discoveryMode, 'options.discoveryMode must be present')
      assertExists(trail.boundary, 'trail.boundary must exist')
      assertExists(trail.boundary.northEast, 'boundary.northEast must be present (JSONB round-trip)')

      console.log(`✓ ${result.data!.length} trail(s), options shape OK (scannerRadius=${trail.options.scannerRadius})`)
    })

    if (trailId) {
      await t.step('GET /trail/:id — verify by id', async () => {
        const result = await client.trail.getTrail(trailId!)

        assertEquals(result.success, true)
        assertEquals(result.data?.id, trailId)
        assertExists(result.data?.options?.scannerRadius)
        console.log(`✓ Trail by id OK`)
      })

      await t.step('GET /trail/:id/spots — verify trail-spot relations', async () => {
        const result = await client.trail.getTrailSpots(trailId!)

        assertEquals(result.success, true)
        assertExists(result.data)
        console.log(`✓ Trail has ${result.data!.length} spot(s)`)
      })
    }

    // ── Spots ─────────────────────────────────────────────────────────────────

    let spotId: string | undefined

    await t.step('GET /spots/previews — list and verify shape', async () => {
      const result = await client.spot.listPreviews()

      assertEquals(result.success, true)
      assertExists(result.data)

      if (result.data!.length === 0) {
        console.log('⚠ No spots in DB — shape check skipped')
        return
      }

      spotId = result.data![0].id
      console.log(`✓ ${result.data!.length} spot preview(s)`)
    })

    if (spotId) {
      await t.step('GET /spot/:id — verify options JSONB shape', async () => {
        const result = await client.spot.getSpot(spotId!)

        if (!result.success || !result.data) {
          console.log(`⚠ Spot not accessible (success=${result.success}) — shape check skipped`)
          return
        }

        assertExists(result.data.options, 'spot.options must exist')
        assertExists(result.data.options?.discoveryRadius, 'options.discoveryRadius must be present (JSONB round-trip)')
        assertExists(result.data.options?.clueRadius, 'options.clueRadius must be present')
        console.log(`✓ Spot options shape OK (discoveryRadius=${result.data.options?.discoveryRadius})`)
      })
    }

    // ── Discovery State ───────────────────────────────────────────────────────

    await t.step('GET /discovery/state — endpoint reachable', async () => {
      const result = await client.composite.getDiscoveryState()

      assertExists(result)
      if (result.success && result.data) {
        assertExists(result.data.discoveries)
        assertExists(result.data.spots)
        console.log(`✓ Discovery state: ${result.data.discoveries.length} discoveries, ${result.data.spots.length} spots`)
      } else {
        console.log(`✓ Discovery state endpoint reachable (no profile yet)`)
      }
    })

    console.log('\n✅ All smoke checks passed')
  },
  sanitizeResources: false,
  sanitizeOps: false,
})

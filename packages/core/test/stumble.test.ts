/**
 * Integration Tests: Stumble / getSuggestions Contract
 *
 * Covers the stumble suggestions endpoint through the HTTP API:
 *
 *   - getSuggestions returns a successful result for a valid location
 *   - getSuggestions returns suggestions filtered by preferences
 *   - getSuggestions with no preferences returns empty suggestions (no OSM filter)
 *   - suggestions contain required fields (id, location, category, name)
 *   - Custom radius is respected
 */
import { assert, assertEquals, assertExists } from '@std/assert'
import * as dotenv from 'dotenv'
import { createTestClient, createToken, useTestServer } from './helpers/testServer.ts'
import { mockPoiConnector } from './helpers/mocks/poiConnector.mock.ts'
import { createAzureMapsConnector } from '../connectors/azureMapsConnector.ts'

dotenv.config({ path: new URL('../.env', import.meta.url).pathname })

// Munich city center — dense OSM data, reliable for integration tests
const MUNICH_CENTER = { lat: 48.1351, lon: 11.582 }

const userClient = createTestClient(createToken('stumble-user-a', 'user', 'app'))

const azureMapsKey = Deno.env.get('AZURE_MAPS_KEY')
const poiConnector = azureMapsKey ? createAzureMapsConnector(azureMapsKey) : mockPoiConnector

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log(`Using POI Connector: ${azureMapsKey ? 'Azure Maps' : 'Mock Data'}`)

Deno.test({
  name: 'Stumble Contract — Integration',
  fn: useTestServer(async (t) => {

    await t.step('getSuggestions returns success for valid location', async () => {
      const result = await userClient.stumble.getSuggestions(
        MUNICH_CENTER.lat,
        MUNICH_CENTER.lon,
        500,
        ['cafe'],
      )

      assertEquals(result.success, true, 'Expected success response')
      assertExists(result.data, 'Expected data in response')
      assert(Array.isArray(result.data), 'Expected data to be an array')
      console.log(`✓ getSuggestions returned ${result.data.length} suggestions`)
    })

    // ── Suggestion shape ───────────────────────────────────────────────────────

    await t.step('suggestions contain required fields', async () => {
      const result = await userClient.stumble.getSuggestions(
        MUNICH_CENTER.lat,
        MUNICH_CENTER.lon,
        500,
        ['historical'],
      )

      assertEquals(result.success, true)

      for (const suggestion of result.data ?? []) {
        assertExists(suggestion.id, 'Missing id')
        assertExists(suggestion.name, 'Missing name')
        assertExists(suggestion.category, 'Missing category')
        assertExists(suggestion.location, 'Missing location')
        assert(typeof suggestion.location.lat === 'number', 'location.lat must be a number')
        assert(typeof suggestion.location.lon === 'number', 'location.lon must be a number')
      }

      console.log(`✓ Suggestion shape validated (${result.data?.length ?? 0} items)`)
    })

    // ── Multiple preferences ───────────────────────────────────────────────────

    await t.step('getSuggestions works with multiple preferences', async () => {
      const result = await userClient.stumble.getSuggestions(
        MUNICH_CENTER.lat,
        MUNICH_CENTER.lon,
        600,
        ['cafe', 'art', 'architecture'],
      )

      assertEquals(result.success, true)
      assert(Array.isArray(result.data), 'Expected array')
      console.log(`✓ Multiple preferences returned ${result.data?.length ?? 0} suggestions`)
    })

    // ── Custom radius ──────────────────────────────────────────────────────────

    await t.step('smaller radius returns fewer or equal suggestions than larger radius', async () => {
      const [smallResult, largeResult] = await Promise.all([
        userClient.stumble.getSuggestions(MUNICH_CENTER.lat, MUNICH_CENTER.lon, 100, ['cafe']),
        userClient.stumble.getSuggestions(MUNICH_CENTER.lat, MUNICH_CENTER.lon, 800, ['cafe']),
      ])

      assertEquals(smallResult.success, true)
      assertEquals(largeResult.success, true)

      const smallCount = smallResult.data?.length ?? 0
      const largeCount = largeResult.data?.length ?? 0
      assert(smallCount <= largeCount, `Small radius (${smallCount}) should return ≤ large radius (${largeCount})`)
      console.log(`✓ Radius check: 100m → ${smallCount}, 800m → ${largeCount}`)
    })

    // ── Category filtering ─────────────────────────────────────────────────────

    await t.step('suggestions only contain categories matching requested preferences', async () => {
      const preferences = ['nature', 'street_art'] as const
      const result = await userClient.stumble.getSuggestions(
        MUNICH_CENTER.lat,
        MUNICH_CENTER.lon,
        500,
        [...preferences],
      )

      assertEquals(result.success, true)

      for (const suggestion of result.data ?? []) {
        assert(
          preferences.includes(suggestion.category as typeof preferences[number]),
          `Unexpected category "${suggestion.category}"`,
        )
      }

      console.log(`✓ All suggestions match requested categories (${result.data?.length ?? 0} items)`)
    })

  }, { poiConnector }),
})

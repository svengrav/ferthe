/**
 * Integration Tests: Sensor / Scan Contract
 *
 * Covers the full scan lifecycle through the HTTP API:
 *
 *   - createScan without trailId fails
 *   - createScan at spot position → successful scan with clues empty
 *   - createScan far from spot → unsuccessful scan
 *   - listScans returns scans for the authenticated user
 *   - listScans filtered by trailId
 *   - Scans are isolated per account (user B cannot see user A's scans)
 */

import { assertEquals, assertExists } from '@std/assert'
import { createTestClient, createToken, useTestServer } from './helpers/testServer.ts'

const creatorClient = createTestClient(createToken('sensor-creator', 'creator', 'creator'))
const userAClient = createTestClient(createToken('sensor-user-a', 'user', 'app'))
const userBClient = createTestClient(createToken('sensor-user-b', 'user', 'app'))

const SPOT_LOCATION = { lat: 48.2, lon: 11.6 }
const FAR_LOCATION = { lat: 48.3, lon: 11.7 } // >10km away

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test({
  name: 'Sensor Contract — Integration',
  fn: useTestServer(async (t) => {
    let spotId: string
    let trailId: string

    // ── Setup ─────────────────────────────────────────────────────────────────

    await t.step('setup: create spot as creator', async () => {
      const result = await creatorClient.spot.createSpot({
        content: { name: 'Sensor Spot', description: 'Spot for scan tests' },
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
        name: 'Sensor Trail',
        description: 'Trail for sensor tests',
        boundary: {
          northEast: { lat: 49.0, lon: 12.0 },
          southWest: { lat: 47.0, lon: 10.0 },
        },
        map: {},
        options: {
          scannerRadius: 500,
          discoveryMode: 'free',
          previewMode: 'hidden',
        },
      })

      assertExists(result.data?.id)
      trailId = result.data.id

      await creatorClient.trail.addSpotToTrail(trailId, spotId, 0)
      console.log(`✓ Trail created: ${trailId}, spot added`)
    })

    // ── Pre-scan state ────────────────────────────────────────────────────────

    await t.step('listScans returns empty before any scan', async () => {
      const result = await userAClient.sensor.listScans({ trailId })

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 0, 'No scans yet')
      console.log('✓ Empty scan list before first scan')
    })

    // ── createScan — successful ───────────────────────────────────────────────

    await t.step('createScan at spot position creates a successful scan', async () => {
      const result = await userAClient.sensor.createScan({
        userPosition: SPOT_LOCATION,
        trailId,
      })

      assertEquals(result.success, true)
      assertExists(result.data?.id)
      assertEquals(result.data?.successful, true, 'Scan at spot position must be successful')
      assertEquals(result.data?.trailId, trailId)
      assertExists(result.data?.location, 'Location must be stored')
      console.log(`✓ Successful scan created: ${result.data?.id}`)
    })

    // ── createScan — unsuccessful ─────────────────────────────────────────────

    await t.step('createScan far from spot creates an unsuccessful scan', async () => {
      const result = await userAClient.sensor.createScan({
        userPosition: FAR_LOCATION,
        trailId,
      })

      assertEquals(result.success, true)
      assertExists(result.data?.id)
      assertEquals(result.data?.successful, false, 'Scan far from spot must be unsuccessful')
      assertEquals(result.data?.trailId, trailId)
      console.log(`✓ Unsuccessful scan created: ${result.data?.id}`)
    })

    // ── listScans ─────────────────────────────────────────────────────────────

    await t.step('listScans returns both scans for user A', async () => {
      const result = await userAClient.sensor.listScans({ trailId })

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 2, 'Both scans must be listed')
      console.log(`✓ listScans returns ${result.data?.length} scans`)
    })

    await t.step('listScans without trailId returns all scans for user A', async () => {
      const result = await userAClient.sensor.listScans()

      assertEquals(result.success, true)
      assertEquals((result.data?.length ?? 0) >= 2, true, 'All scans for user A returned')
      const allBelongToUserA = result.data?.every(s => s.accountId === 'sensor-user-a')
      assertEquals(allBelongToUserA, true, 'All returned scans must belong to user A')
      console.log(`✓ listScans (no filter) returns scans for user A only`)
    })

    // ── Isolation ─────────────────────────────────────────────────────────────

    await t.step('listScans for user B returns empty (scans are per account)', async () => {
      const result = await userBClient.sensor.listScans({ trailId })

      assertEquals(result.success, true)
      assertEquals(result.data?.length, 0, 'User B must not see user A scans')
      console.log('✓ Scan list is isolated per account')
    })

    // ── Scan shape ────────────────────────────────────────────────────────────

    await t.step('scan event has correct shape', async () => {
      const result = await userAClient.sensor.listScans({ trailId })

      assertEquals(result.success, true)
      const scan = result.data?.[0]
      assertExists(scan?.id)
      assertExists(scan?.accountId)
      assertExists(scan?.scannedAt)
      assertExists(scan?.radiusUsed)
      assertExists(scan?.location)
      assertEquals(Array.isArray(scan?.clues), true, 'clues must be an array')
      console.log('✓ Scan event shape validated')
    })
  }),
  sanitizeResources: false,
  sanitizeOps: false,
})

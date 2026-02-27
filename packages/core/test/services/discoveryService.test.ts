import { createDiscoveryService } from '@core/features/discovery/discoveryService.ts'
import { assertEquals, assertNotEquals } from '@std/assert'
import { makeDiscovery, makeScanEvent, makeSpot, makeTrail } from './fixtures.ts'

const svc = createDiscoveryService()

// ─── enrichSpotWithSource ────────────────────────────────────────────────────

Deno.test('enrichSpotWithSource: created when user is creator', () => {
  const spot = makeSpot({ createdBy: 'user-1' })
  const result = svc.enrichSpotWithSource(spot, 'user-1', [])
  assertEquals(result.source, 'created')
})

Deno.test('enrichSpotWithSource: discovery when user has discovered', () => {
  const spot = makeSpot({ id: 'spot-1', createdBy: 'other' })
  const discovery = makeDiscovery({ accountId: 'user-1', spotId: 'spot-1' })
  const result = svc.enrichSpotWithSource(spot, 'user-1', [discovery])
  assertEquals(result.source, 'discovery')
})

Deno.test('enrichSpotWithSource: preview when not discovered and not creator', () => {
  const spot = makeSpot({ id: 'spot-1', createdBy: 'other' })
  const result = svc.enrichSpotWithSource(spot, 'user-1', [])
  assertEquals(result.source, 'preview')
})

// ─── filterSpotBySource ───────────────────────────────────────────────────────

Deno.test('filterSpotBySource: returns full spot for discovery source', () => {
  const spot = makeSpot({ source: 'discovery', description: 'secret' })
  const result = svc.filterSpotBySource(spot)
  assertEquals(result?.description, 'secret')
})

Deno.test('filterSpotBySource: obfuscates location and hides description for preview', () => {
  const spot = makeSpot({ source: 'preview', location: { lat: 51.12345, lon: 7.98765 }, description: 'secret' })
  const result = svc.filterSpotBySource(spot)
  assertEquals(result?.description, '')
  assertEquals(result?.image, undefined)
  // Location rounded to ~2 decimal places
  assertEquals(result?.location.lat, 51.12)
  assertEquals(result?.location.lon, 7.99)
})

Deno.test('filterSpotBySource: returns undefined if no source set', () => {
  const spot = makeSpot({ source: undefined })
  const result = svc.filterSpotBySource(spot)
  assertEquals(result, undefined)
})

// ─── isTrailCompleted / getTrailCompletionPercentage ─────────────────────────

Deno.test('isTrailCompleted: true when all spots discovered', () => {
  const discoveries = [
    makeDiscovery({ accountId: 'user-1', spotId: 'spot-1', trailId: 'trail-1' }),
    makeDiscovery({ id: 'd-2', accountId: 'user-1', spotId: 'spot-2', trailId: 'trail-1' }),
  ]
  const result = svc.isTrailCompleted('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result, true)
})

Deno.test('isTrailCompleted: false when some spots missing', () => {
  const discoveries = [makeDiscovery({ accountId: 'user-1', spotId: 'spot-1', trailId: 'trail-1' })]
  const result = svc.isTrailCompleted('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result, false)
})

Deno.test('getTrailCompletionPercentage: 50% when 1 of 2 discovered', () => {
  const discoveries = [makeDiscovery({ accountId: 'user-1', spotId: 'spot-1', trailId: 'trail-1' })]
  const result = svc.getTrailCompletionPercentage('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result, 50)
})

Deno.test('getTrailCompletionPercentage: 0 when no spots in trail', () => {
  const result = svc.getTrailCompletionPercentage('user-1', 'trail-1', [], [])
  assertEquals(result, 0)
})

// ─── processScanEvent ─────────────────────────────────────────────────────────

Deno.test('processScanEvent: returns null for unsuccessful scan', () => {
  const scanEvent = makeScanEvent({ successful: false, clues: [{ spotId: 'spot-1' }] as any })
  const trail = makeTrail({ options: { scannerRadius: 100, discoveryMode: 'free', previewMode: 'hidden' } })
  const result = svc.processScanEvent(scanEvent, trail, [], ['spot-1'])
  assertEquals(result, null)
})

Deno.test('processScanEvent: returns null when clues empty', () => {
  const scanEvent = makeScanEvent({ successful: true, clues: [] })
  const trail = makeTrail()
  const result = svc.processScanEvent(scanEvent, trail, [], ['spot-1'])
  assertEquals(result, null)
})

Deno.test('processScanEvent: free mode discovers all new spots from clues', () => {
  const clue = { spotId: 'spot-1', id: 'c1', trailId: 'trail-1', location: { lat: 51.5, lon: 7.5 }, source: 'scanEvent', discoveryRadius: 50 } as any
  const scanEvent = makeScanEvent({ accountId: 'user-1', trailId: 'trail-1', successful: true, clues: [clue] })
  const trail = makeTrail({ options: { scannerRadius: 100, discoveryMode: 'free', previewMode: 'hidden' } })

  const result = svc.processScanEvent(scanEvent, trail, [], ['spot-1'])
  assertEquals(result?.length, 1)
  assertEquals(result?.[0].spotId, 'spot-1')
  assertEquals(result?.[0].accountId, 'user-1')
})

Deno.test('processScanEvent: free mode skips already discovered spots', () => {
  const clue = { spotId: 'spot-1', id: 'c1', trailId: 'trail-1', location: { lat: 51.5, lon: 7.5 }, source: 'scanEvent', discoveryRadius: 50 } as any
  const scanEvent = makeScanEvent({ accountId: 'user-1', trailId: 'trail-1', successful: true, clues: [clue] })
  const trail = makeTrail({ options: { scannerRadius: 100, discoveryMode: 'free', previewMode: 'hidden' } })
  const existing = makeDiscovery({ accountId: 'user-1', spotId: 'spot-1', trailId: 'trail-1' })

  const result = svc.processScanEvent(scanEvent, trail, [existing], ['spot-1'])
  assertEquals(result, null)
})

Deno.test('processScanEvent: sequence mode only discovers next spot in order', () => {
  const clues = [
    { spotId: 'spot-1', id: 'c1', trailId: 'trail-1', location: { lat: 51.5, lon: 7.5 }, source: 'scanEvent', discoveryRadius: 50 },
    { spotId: 'spot-2', id: 'c2', trailId: 'trail-1', location: { lat: 51.5, lon: 7.5 }, source: 'scanEvent', discoveryRadius: 50 },
  ] as any[]
  const scanEvent = makeScanEvent({ accountId: 'user-1', trailId: 'trail-1', successful: true, clues })
  const trail = makeTrail({ options: { scannerRadius: 100, discoveryMode: 'sequence', previewMode: 'hidden' } })

  const result = svc.processScanEvent(scanEvent, trail, [], ['spot-1', 'spot-2'])
  // Only first spot should be discovered
  assertEquals(result?.length, 1)
  assertEquals(result?.[0].spotId, 'spot-1')
})

// ─── getNewDiscoveries ────────────────────────────────────────────────────────

Deno.test('getNewDiscoveries: discovers spot within radius', () => {
  // Same exact location → distance = 0 → within any discoveryRadius
  const spot = makeSpot({ id: 'spot-1', createdBy: 'other', location: { lat: 51.5, lon: 7.5 }, options: { discoveryRadius: 50, clueRadius: 200 } })
  const trail = makeTrail({ id: 'trail-1' })

  const result = svc.getNewDiscoveries('user-1', { lat: 51.5, lon: 7.5 }, [spot], [], trail)
  assertEquals(result.length, 1)
  assertEquals(result[0].spotId, 'spot-1')
})

Deno.test('getNewDiscoveries: does not discover spot out of radius', () => {
  // ~500m away, discoveryRadius = 50m
  const spot = makeSpot({ id: 'spot-1', createdBy: 'other', location: { lat: 51.505, lon: 7.5 }, options: { discoveryRadius: 50, clueRadius: 200 } })
  const trail = makeTrail()

  const result = svc.getNewDiscoveries('user-1', { lat: 51.5, lon: 7.5 }, [spot], [], trail)
  assertEquals(result.length, 0)
})

Deno.test('getNewDiscoveries: skips already discovered spots', () => {
  const spot = makeSpot({ id: 'spot-1', createdBy: 'other', location: { lat: 51.5, lon: 7.5 } })
  const discovery = makeDiscovery({ accountId: 'user-1', spotId: 'spot-1', trailId: 'trail-1' })
  const trail = makeTrail()

  const result = svc.getNewDiscoveries('user-1', { lat: 51.5, lon: 7.5 }, [spot], [discovery], trail)
  assertEquals(result.length, 0)
})

Deno.test('getNewDiscoveries: skips spots created by the user', () => {
  const spot = makeSpot({ id: 'spot-1', createdBy: 'user-1', location: { lat: 51.5, lon: 7.5 } })
  const trail = makeTrail()

  const result = svc.getNewDiscoveries('user-1', { lat: 51.5, lon: 7.5 }, [spot], [], trail)
  assertEquals(result.length, 0)
})

// ─── getDiscoverySnap ─────────────────────────────────────────────────────────

Deno.test('getDiscoverySnap: returns undefined when all spots explored', () => {
  const spot = makeSpot({ id: 'spot-1' })
  const result = svc.getDiscoverySnap({ lat: 51.5, lon: 7.5 }, [spot], ['spot-1'])
  assertEquals(result, undefined)
})

Deno.test('getDiscoverySnap: intensity 1 when on top of spot', () => {
  const spot = makeSpot({ id: 'spot-1', location: { lat: 51.5, lon: 7.5 } })
  const result = svc.getDiscoverySnap({ lat: 51.5, lon: 7.5 }, [spot], [], 1000)
  assertEquals(result?.intensity, 1)
  assertEquals(result?.distance, 0)
})

Deno.test('getDiscoverySnap: zero intensity outside maxRange', () => {
  // ~500m away with maxRange = 100
  const spot = makeSpot({ id: 'spot-1', location: { lat: 51.505, lon: 7.5 } })
  const result = svc.getDiscoverySnap({ lat: 51.5, lon: 7.5 }, [spot], [], 100)
  assertEquals(result?.intensity, 0)
})

Deno.test('getDiscoverySnap: partial intensity between 0 and 1', () => {
  // ~275m away, maxRange 1000 → intensity ≈ 0.725
  const spot = makeSpot({ id: 'spot-1', location: { lat: 51.5025, lon: 7.5 } })
  const result = svc.getDiscoverySnap({ lat: 51.5, lon: 7.5 }, [spot], [], 1000)
  assertNotEquals(result?.intensity, 0)
  assertNotEquals(result?.intensity, 1)
  assertEquals(result!.intensity > 0 && result!.intensity < 1, true)
})

// ─── getSpotRatingSummary ─────────────────────────────────────────────────────

Deno.test('getSpotRatingSummary: correct average and count', () => {
  const now = new Date()
  const ratings = [
    { id: 'r1', spotId: 'spot-1', accountId: 'user-1', rating: 4, createdAt: now },
    { id: 'r2', spotId: 'spot-1', accountId: 'user-2', rating: 2, createdAt: now },
  ]
  const result = svc.getSpotRatingSummary('spot-1', ratings, 'user-1')
  assertEquals(result.average, 3)
  assertEquals(result.count, 2)
  assertEquals(result.userRating, 4)
})

Deno.test('getSpotRatingSummary: 0 average when no ratings', () => {
  const result = svc.getSpotRatingSummary('spot-1', [], 'user-1')
  assertEquals(result.average, 0)
  assertEquals(result.count, 0)
  assertEquals(result.userRating, undefined)
})

// ─── createSpotRating ─────────────────────────────────────────────────────────

Deno.test('createSpotRating: clamps rating to 1-5 range', () => {
  assertEquals(svc.createSpotRating('u', 's', 0).rating, 1)
  assertEquals(svc.createSpotRating('u', 's', 6).rating, 5)
  assertEquals(svc.createSpotRating('u', 's', 3).rating, 3)
})

Deno.test('createSpotRating: same input produces same deterministic id', () => {
  const a = svc.createSpotRating('user-1', 'spot-1', 4)
  const b = svc.createSpotRating('user-1', 'spot-1', 5)
  assertEquals(a.id, b.id) // id derived from accountId + spotId only
})

// ─── getDiscoveredSpotIds ─────────────────────────────────────────────────────

Deno.test('getDiscoveredSpotIds: filters by trailId when provided', () => {
  const discoveries = [
    makeDiscovery({ accountId: 'user-1', spotId: 'spot-1', trailId: 'trail-1' }),
    makeDiscovery({ id: 'd-2', accountId: 'user-1', spotId: 'spot-2', trailId: 'trail-2' }),
  ]
  const result = svc.getDiscoveredSpotIds('user-1', discoveries, 'trail-1')
  assertEquals(result, ['spot-1'])
})

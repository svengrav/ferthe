import { createSensorService } from '@core/features/sensor/sensorService.ts'
import { assertEquals } from '@std/assert'
import { makeDiscovery, makeSpot } from './fixtures.ts'

const svc = createSensorService()

const location = { lat: 51.5, lon: 7.5 }

Deno.test('generateScanEvent: successful when spot is within radius', () => {
  const spot = makeSpot({ id: 'spot-1', createdBy: 'other', location })
  const result = svc.generateScanEvent('user-1', location, [spot], 100, [])
  assertEquals(result.successful, true)
})

Deno.test('generateScanEvent: unsuccessful when no spots in range', () => {
  // ~500m away
  const spot = makeSpot({ id: 'spot-1', createdBy: 'other', location: { lat: 51.505, lon: 7.5 } })
  const result = svc.generateScanEvent('user-1', location, [spot], 100, [])
  assertEquals(result.successful, false)
})

Deno.test('generateScanEvent: excludes spots created by scanning user', () => {
  const ownSpot = makeSpot({ id: 'spot-1', createdBy: 'user-1', location })
  const result = svc.generateScanEvent('user-1', location, [ownSpot], 100, [])
  assertEquals(result.successful, false)
  assertEquals(result.clues.length, 0)
})

Deno.test('generateScanEvent: generates clue when spot is in clue range but outside discovery radius', () => {
  // Spot is ~200m away, discoveryRadius = 50m, scanner radius = 300m
  const spot = makeSpot({
    id: 'spot-1',
    createdBy: 'other',
    location: { lat: 51.5018, lon: 7.5 }, // ~200m away
    options: { discoveryRadius: 50, clueRadius: 300 },
  })
  const result = svc.generateScanEvent('user-1', location, [spot], 300, [])
  assertEquals(result.clues.length, 1)
  assertEquals(result.clues[0].spotId, 'spot-1')
})

Deno.test('generateScanEvent: no clue for already discovered spot', () => {
  const spot = makeSpot({
    id: 'spot-1',
    createdBy: 'other',
    location: { lat: 51.5018, lon: 7.5 },
    options: { discoveryRadius: 50, clueRadius: 300 },
  })
  const discovery = makeDiscovery({ accountId: 'user-1', spotId: 'spot-1' })
  const result = svc.generateScanEvent('user-1', location, [spot], 300, [discovery])
  assertEquals(result.clues.length, 0)
})

Deno.test('generateScanEvent: includes accountId and location in result', () => {
  const result = svc.generateScanEvent('user-1', location, [], 100, [])
  assertEquals(result.accountId, 'user-1')
  assertEquals(result.location, location)
})

Deno.test('generateScanEvent: passes trailId to scan event', () => {
  const result = svc.generateScanEvent('user-1', location, [], 100, [], 'trail-1')
  assertEquals(result.trailId, 'trail-1')
})

import { createTrailService } from '@core/features/trail/trailService.ts'
import { assertEquals } from '@std/assert'
import { makeDiscovery } from './fixtures.ts'

const svc = createTrailService()

const d = (id: string, spotId: string, account = 'user-1', trail = 'trail-1', discoveredAt?: Date) =>
  makeDiscovery({ id, accountId: account, spotId, trailId: trail, discoveredAt: discoveredAt ?? new Date('2024-01-01T10:00:00') })

// ─── completionStatus ─────────────────────────────────────────────────────────

Deno.test('getTrailStats: not_started when no discoveries', () => {
  const result = svc.getTrailStats('user-1', 'trail-1', [], ['spot-1', 'spot-2'])
  assertEquals(result.completionStatus, 'not_started')
  assertEquals(result.discoveredSpots, 0)
  assertEquals(result.progressPercentage, 0)
})

Deno.test('getTrailStats: in_progress when partially discovered', () => {
  const discoveries = [d('d1', 'spot-1')]
  const result = svc.getTrailStats('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result.completionStatus, 'in_progress')
  assertEquals(result.progressPercentage, 50)
})

Deno.test('getTrailStats: completed when all spots discovered', () => {
  const discoveries = [d('d1', 'spot-1'), d('d2', 'spot-2')]
  const result = svc.getTrailStats('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result.completionStatus, 'completed')
  assertEquals(result.progressPercentage, 100)
  assertEquals(result.discoveredSpots, 2)
})

// ─── rank ─────────────────────────────────────────────────────────────────────

Deno.test('getTrailStats: rank 0 when not started', () => {
  const result = svc.getTrailStats('user-1', 'trail-1', [], ['spot-1'])
  assertEquals(result.rank, 0)
})

Deno.test('getTrailStats: rank 1 when leading discoverer', () => {
  const discoveries = [
    d('d1', 'spot-1', 'user-1'),
    d('d2', 'spot-2', 'user-1'),
    d('d3', 'spot-1', 'user-2'), // user-2 has only 1 spot
  ]
  const result = svc.getTrailStats('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result.rank, 1)
  assertEquals(result.totalDiscoverers, 2)
})

Deno.test('getTrailStats: rank 2 when second best discoverer', () => {
  const discoveries = [
    d('d1', 'spot-1', 'user-2'),
    d('d2', 'spot-2', 'user-2'),
    d('d3', 'spot-1', 'user-1'), // user-1 has only 1 spot
  ]
  const result = svc.getTrailStats('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result.rank, 2)
})

// ─── totalSpots / totals ───────────────────────────────────────────────────────

Deno.test('getTrailStats: totalSpots matches trailSpotIds length', () => {
  const result = svc.getTrailStats('user-1', 'trail-1', [], ['spot-1', 'spot-2', 'spot-3'])
  assertEquals(result.totalSpots, 3)
})

Deno.test('getTrailStats: ignores discoveries from other trails', () => {
  const discoveries = [d('d1', 'spot-1', 'user-1', 'trail-OTHER')]
  const result = svc.getTrailStats('user-1', 'trail-1', discoveries, ['spot-1'])
  assertEquals(result.discoveredSpots, 0)
  assertEquals(result.completionStatus, 'not_started')
})

Deno.test('getTrailStats: ignores discoveries from other users', () => {
  const discoveries = [d('d1', 'spot-1', 'user-2')]
  const result = svc.getTrailStats('user-1', 'trail-1', discoveries, ['spot-1'])
  assertEquals(result.discoveredSpots, 0)
})

// ─── time-based stats ─────────────────────────────────────────────────────────

Deno.test('getTrailStats: calculates averageTimeBetweenDiscoveries', () => {
  const discoveries = [
    d('d1', 'spot-1', 'user-1', 'trail-1', new Date('2024-01-01T10:00:00')),
    d('d2', 'spot-2', 'user-1', 'trail-1', new Date('2024-01-01T10:01:00')), // 60s later
  ]
  const result = svc.getTrailStats('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result.averageTimeBetweenDiscoveries, 60)
})

Deno.test('getTrailStats: no averageTimeBetweenDiscoveries for single discovery', () => {
  const discoveries = [d('d1', 'spot-1')]
  const result = svc.getTrailStats('user-1', 'trail-1', discoveries, ['spot-1', 'spot-2'])
  assertEquals(result.averageTimeBetweenDiscoveries, undefined)
})

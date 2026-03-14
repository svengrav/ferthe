import { assertEquals, assertExists, assert } from '@std/assert'
import {
  filterAndRankPois,
  calculateFeedbackDelta,
  buildVisit,
  buildFeedback,
  deduplicatePois,
  toStumblePoi,
} from '@core/features/stumble/stumbleService.ts'
import type { StumblePoi } from '@shared/contracts/stumble.ts'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makePoi = (overrides: Partial<StumblePoi> = {}): StumblePoi => ({
  id: 'poi-1',
  externalId: 'osm:123',
  name: 'Test POI',
  location: { lat: 48.135, lon: 11.582 },
  poiType: 'cafe',
  source: 'osm',
  feedbackScore: 0,
  ...overrides,
})

// ── toStumblePoi ──────────────────────────────────────────────────────────────

Deno.test('toStumblePoi: sets source-prefixed externalId', () => {
  const result = toStumblePoi({ id: 'abc', lat: 1, lon: 2, name: 'Café', category: 'cafe' })
  assertEquals(result.externalId, 'osm:abc')
  assertEquals(result.source, 'osm')
})

Deno.test('toStumblePoi: prefers osmId over id for externalId', () => {
  const result = toStumblePoi({ id: 'abc', osmId: 'node/999', lat: 1, lon: 2, name: 'Café', category: 'cafe' })
  assertEquals(result.externalId, 'osm:node/999')
})

Deno.test('toStumblePoi: custom source prefix', () => {
  const result = toStumblePoi({ id: 'abc', lat: 1, lon: 2, name: 'Café', category: 'cafe' }, 'azure')
  assertEquals(result.externalId, 'azure:abc')
  assertEquals(result.source, 'azure')
})

Deno.test('toStumblePoi: empty name falls back to empty string', () => {
  const result = toStumblePoi({ id: 'x', lat: 0, lon: 0, category: 'art' })
  assertEquals(result.name, '')
})

Deno.test('toStumblePoi: initializes feedbackScore to 0', () => {
  const result = toStumblePoi({ id: 'x', lat: 0, lon: 0, name: 'X', category: 'art' })
  assertEquals(result.feedbackScore, 0)
})

// ── deduplicatePois ───────────────────────────────────────────────────────────

Deno.test('deduplicatePois: keeps POI with unique externalId and different name', () => {
  const newPoi = makePoi({ externalId: 'osm:new', name: 'New Café' })
  const existing = makePoi({ externalId: 'osm:existing', name: 'Old Café' })
  const result = deduplicatePois([newPoi], [existing])
  assertEquals(result.length, 1)
})

Deno.test('deduplicatePois: removes POI with duplicate externalId', () => {
  const poi = makePoi({ externalId: 'osm:123' })
  const result = deduplicatePois([poi], [poi])
  assertEquals(result.length, 0)
})

Deno.test('deduplicatePois: removes POI within 30m with same name', () => {
  const existing = makePoi({ externalId: 'azure:1', location: { lat: 48.1351, lon: 11.5821 } })
  const nearby = makePoi({ externalId: 'osm:2', location: { lat: 48.13511, lon: 11.58211 } }) // ~1m away
  const result = deduplicatePois([nearby], [existing])
  assertEquals(result.length, 0)
})

Deno.test('deduplicatePois: keeps POI >30m away even with same name', () => {
  const existing = makePoi({ externalId: 'azure:1', location: { lat: 48.1351, lon: 11.5821 } })
  const farAway = makePoi({ externalId: 'osm:2', location: { lat: 48.1360, lon: 11.5840 } }) // ~150m away
  const result = deduplicatePois([farAway], [existing])
  assertEquals(result.length, 1)
})

Deno.test('deduplicatePois: returns all POIs when existingPois is empty', () => {
  const pois = [makePoi({ externalId: 'osm:1' }), makePoi({ externalId: 'osm:2', id: 'poi-2' })]
  const result = deduplicatePois(pois, [])
  assertEquals(result.length, 2)
})

// ── filterAndRankPois ─────────────────────────────────────────────────────────

Deno.test('filterAndRankPois: filters by preference', () => {
  const pois = [
    makePoi({ id: 'a', poiType: 'cafe' }),
    makePoi({ id: 'b', poiType: 'art' }),
    makePoi({ id: 'c', poiType: 'cafe' }),
  ]
  const result = filterAndRankPois(pois, ['cafe'], 10)
  assertEquals(result.length, 2)
  assert(result.every(p => p.poiType === 'cafe'))
})

Deno.test('filterAndRankPois: empty preferences returns all POIs', () => {
  const pois = [makePoi({ id: 'a', poiType: 'cafe' }), makePoi({ id: 'b', poiType: 'art' })]
  const result = filterAndRankPois(pois, [], 10)
  assertEquals(result.length, 2)
})

Deno.test('filterAndRankPois: sorts by feedbackScore descending', () => {
  const pois = [
    makePoi({ id: 'low', poiType: 'cafe', feedbackScore: 1 }),
    makePoi({ id: 'high', poiType: 'cafe', feedbackScore: 5 }),
    makePoi({ id: 'mid', poiType: 'cafe', feedbackScore: 3 }),
  ]
  const result = filterAndRankPois(pois, ['cafe'], 10)
  assertEquals(result[0].id, 'high')
  assertEquals(result[1].id, 'mid')
  assertEquals(result[2].id, 'low')
})

Deno.test('filterAndRankPois: respects limit', () => {
  const pois = Array.from({ length: 10 }, (_, i) => makePoi({ id: `poi-${i}`, externalId: `osm:${i}` }))
  const result = filterAndRankPois(pois, [], 3)
  assertEquals(result.length, 3)
})

Deno.test('filterAndRankPois: treats undefined feedbackScore as 0', () => {
  const pois = [
    makePoi({ id: 'a', poiType: 'cafe', feedbackScore: undefined }),
    makePoi({ id: 'b', poiType: 'cafe', feedbackScore: 1 }),
  ]
  const result = filterAndRankPois(pois, ['cafe'], 10)
  assertEquals(result[0].id, 'b')
})

// ── calculateFeedbackDelta ────────────────────────────────────────────────────

Deno.test('calculateFeedbackDelta: up vote with no existing → +1', () => {
  assertEquals(calculateFeedbackDelta('up'), 1)
})

Deno.test('calculateFeedbackDelta: down vote with no existing → -1', () => {
  assertEquals(calculateFeedbackDelta('down'), -1)
})

Deno.test('calculateFeedbackDelta: up vote replacing down → +2', () => {
  assertEquals(calculateFeedbackDelta('up', 'down'), 2)
})

Deno.test('calculateFeedbackDelta: down vote replacing up → -2', () => {
  assertEquals(calculateFeedbackDelta('down', 'up'), -2)
})

Deno.test('calculateFeedbackDelta: same vote repeated → 0', () => {
  assertEquals(calculateFeedbackDelta('up', 'up'), 0)
  assertEquals(calculateFeedbackDelta('down', 'down'), 0)
})

// ── buildVisit ────────────────────────────────────────────────────────────────

Deno.test('buildVisit: sets required fields', () => {
  const visit = buildVisit('acc-1', 'poi-1')
  assertEquals(visit.accountId, 'acc-1')
  assertEquals(visit.poiId, 'poi-1')
  assertExists(visit.id)
  assert(visit.visitedAt > 0)
  assertEquals(visit.spotId, undefined)
})

Deno.test('buildVisit: sets spotId when provided', () => {
  const visit = buildVisit('acc-1', 'poi-1', 'spot-x')
  assertEquals(visit.spotId, 'spot-x')
})

Deno.test('buildVisit: deterministic id for same inputs', () => {
  const a = buildVisit('acc-1', 'poi-1')
  const b = buildVisit('acc-1', 'poi-1')
  assertEquals(a.id, b.id)
})

Deno.test('buildVisit: different id for different inputs', () => {
  const a = buildVisit('acc-1', 'poi-1')
  const b = buildVisit('acc-1', 'poi-2')
  assert(a.id !== b.id)
})

// ── buildFeedback ─────────────────────────────────────────────────────────────

Deno.test('buildFeedback: sets required fields', () => {
  const fb = buildFeedback('acc-1', 'poi-1', 'up')
  assertEquals(fb.accountId, 'acc-1')
  assertEquals(fb.poiId, 'poi-1')
  assertEquals(fb.vote, 'up')
  assertExists(fb.id)
  assert(fb.createdAt > 0)
})

Deno.test('buildFeedback: deterministic id for same inputs', () => {
  const a = buildFeedback('acc-1', 'poi-1', 'up')
  const b = buildFeedback('acc-1', 'poi-1', 'down')
  assertEquals(a.id, b.id) // id is independent of vote
})

Deno.test('buildFeedback: different id for different account/poi', () => {
  const a = buildFeedback('acc-1', 'poi-1', 'up')
  const b = buildFeedback('acc-2', 'poi-1', 'up')
  assert(a.id !== b.id)
})

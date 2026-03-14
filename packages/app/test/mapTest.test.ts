// packages/app/test/useTrailSpotsViewModel.test.ts

import { act, renderHook } from '@testing-library/react-native'
import { spotStore } from '@app/features/spot/stores/spotStore'
import { trailStore } from '@app/features/trail/stores/trailStore'
import { buildTrailSpotsViewModel, useTrailSpotsViewModel } from '@app/features/trail/hooks/useTrailSpotsViewModel'
import type { Spot, SpotPreview } from '@shared/contracts'

// --- Fixtures ---

const makeSpot = (id: string, overrides: Partial<Spot> = {}): Spot => ({
  id,
  slug: id,
  name: `Spot ${id}`,
  description: '',
  location: { lat: 51.5, lon: 7.5 },
  options: { discoveryRadius: 50, clueRadius: 200 },
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makePreview = (id: string, overrides: Partial<SpotPreview> = {}): SpotPreview => ({
  id,
  rating: { average: 0, count: 0 },
  blurredImage: { id: `blur-${id}`, url: `blur-${id}.jpg` },
  ...overrides,
})

// --- Unit Tests (reine Funktion, kein React) ---

describe('buildTrailSpotsViewModel', () => {
  test('returns discovered spot with full data', () => {
    const result = buildTrailSpotsViewModel(
      ['s1'],
      { s1: makeSpot('s1') },
      {},
    )
    expect(result[0]).toMatchObject({ id: 's1', discovered: true, title: 'Spot s1' })
  })

  test('returns locked spot with blurred image when undiscovered', () => {
    const result = buildTrailSpotsViewModel(
      ['s1'],
      {},
      { s1: makePreview('s1') },
    )
    expect(result[0]).toMatchObject({ discovered: false, blurredImage: { url: 'blur-s1.jpg' } })
  })

  test('returns locked spot with spotId as id when no preview', () => {
    const result = buildTrailSpotsViewModel(['s1'], {}, {})
    expect(result[0]).toMatchObject({ id: 's1', discovered: false, blurredImage: undefined })
  })

  test('preserves trail order', () => {
    const result = buildTrailSpotsViewModel(['s1', 's2'], {}, {})
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
  })
})

// --- Integration Test (Store → Hook) ---

describe('useTrailSpotsViewModel (integration)', () => {
  beforeEach(() => {
    spotStore.setState({ byId: {}, previewsById: {} })
    trailStore.setState({ trailSpotIds: {} })
  })

  test('reagiert reaktiv auf Store-Updates', () => {
    trailStore.getState().setTrailSpotIds('trail-1', ['s1'])

    const { result } = renderHook(() => useTrailSpotsViewModel('trail-1'))
    expect(result.current[0]).toMatchObject({ id: 's1', discovered: false })

    act(() => {
      spotStore.getState().upsertSpot(makeSpot('s1'))
    })

    expect(result.current[0]).toMatchObject({ id: 's1', discovered: true, title: 'Spot s1' })
  })
})
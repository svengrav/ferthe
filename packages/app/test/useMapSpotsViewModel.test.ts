import { renderHook, act } from '@testing-library/react-native'
import { spotStore } from '@app/features/spot/stores/spotStore'
import { discoveryTrailStore } from '@app/features/discovery/stores/discoveryTrailStore'
import { useMapSpotsViewModel } from '@app/features/map/hooks/useMapSpotsViewModel'
import type { Spot } from '@shared/contracts'

// --- Fixtures ---

const makeSpot = (overrides: Partial<Spot> = {}): Spot => ({
  id: 'spot-1',
  slug: 'spot-1',
  name: 'Test Spot',
  description: 'desc',
  location: { lat: 51.5, lon: 7.5 },
  options: { discoveryRadius: 50, clueRadius: 200 },
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// --- Tests ---

describe('useMapSpotsViewModel', () => {
  beforeEach(() => {
    spotStore.setState({ byId: {} })
    discoveryTrailStore.setState({ spotIds: [] })
  })

  test('includes created spot even when spotIds is empty', () => {
    act(() => {
      spotStore.getState().upsertSpot(makeSpot({ source: 'created' }))
    })

    const { result } = renderHook(() => useMapSpotsViewModel())

    expect(result.current.some(s => s.id === 'spot-1')).toBe(true)
  })

  test('does not include preview spot when not in discoveryTrailStore.spotIds', () => {
    act(() => {
      spotStore.getState().upsertSpot(makeSpot({ id: 'spot-2', slug: 'spot-2', source: 'preview' }))
    })

    const { result } = renderHook(() => useMapSpotsViewModel())

    expect(result.current.some(s => s.id === 'spot-2')).toBe(false)
  })

  test('includes spot from discoveryTrailStore.spotIds regardless of source', () => {
    act(() => {
      spotStore.getState().upsertSpot(makeSpot({ source: 'discovery' }))
      discoveryTrailStore.getState().setDiscoveryTrail({ spotIds: ['spot-1'] })
    })

    const { result } = renderHook(() => useMapSpotsViewModel())

    expect(result.current.some(s => s.id === 'spot-1')).toBe(true)
  })

  test('deduplicates when created spot is also in discoveryTrailStore.spotIds', () => {
    act(() => {
      spotStore.getState().upsertSpot(makeSpot({ source: 'created' }))
      discoveryTrailStore.getState().setDiscoveryTrail({ spotIds: ['spot-1'] })
    })

    const { result } = renderHook(() => useMapSpotsViewModel())

    const matches = result.current.filter(s => s.id === 'spot-1')
    expect(matches).toHaveLength(1)
  })
})

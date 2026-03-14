// packages/app/test/useTrailSpotsViewModel.test.ts (Integration)

import { act, renderHook } from '@testing-library/react-native'
import { spotStore } from '@app/features/spot/stores/spotStore'
import { trailStore } from '@app/features/trail/stores/trailStore'
import { createTrailApplication } from '@app/features/trail/application'
import { useTrailSpotsViewModel } from '@app/features/trail/hooks/useTrailSpotsViewModel'

// --- Mock API ---
const mockApi = {
  trail: {
    getTrailSpots: jest.fn(),
  },
} as any

// --- Setup ---
beforeEach(() => {
  spotStore.setState({ byId: {}, previewsById: {} })
  trailStore.setState({ trailSpotIds: {}, byId: {} })
  jest.clearAllMocks()
})

/**
 * 
 */
test('requestTrailSpotPreviews befüllt Store, Hook reagiert reaktiv', async () => {
  mockApi.trail.getTrailSpots.mockResolvedValue({
    success: true,
    data: [
      { spotId: 's1', preview: { blurredImage: { url: 'blur.jpg' }, rating: { average: 0, count: 0 } } },
      { spotId: 's2', preview: null },
    ],
  })

  const trailApplication = createTrailApplication({ api: mockApi })
  const { result } = renderHook(() => useTrailSpotsViewModel('trail-1'))

  // Initial: Store leer → Hook gibt leeres Array
  expect(result.current).toHaveLength(0)

  // Application befüllt Store
  await act(() => trailApplication.requestTrailSpotPreviews('trail-1'))

  // Hook reagiert: 2 undiscovered spots, einer mit Preview
  expect(result.current).toHaveLength(2)
  expect(result.current[0]).toMatchObject({ id: 's1', discovered: false, blurredImage: { url: 'blur.jpg' } })
  expect(result.current[1]).toMatchObject({ id: 's2', discovered: false, blurredImage: undefined })
})

test('spot wird nach Discovery entdeckt → Hook aktualisiert discovered-Flag', async () => {
  // Precondition: Trail-Spots schon geladen
  trailStore.getState().setTrailSpotIds('trail-1', ['s1'])

  const { result } = renderHook(() => useTrailSpotsViewModel('trail-1'))
  expect(result.current[0]).toMatchObject({ discovered: false })

  // Discovery-Application (oder ScanEvent) upserted den Spot
  act(() => {
    spotStore.getState().upsertSpot({
      id: 's1', slug: 's1', name: 'Burg Altena',
      location: { lat: 51.3, lon: 7.7 },
      options: { discoveryRadius: 50, clueRadius: 200 },
      createdBy: 'user-1', createdAt: new Date(), updatedAt: new Date(),
      description: 'Eine tolle Burg in Altena.',
    })
  })

  expect(result.current[0]).toMatchObject({ discovered: true, title: 'Burg Altena' })
})
import type { Discovery, ScanEvent, Spot, Trail } from '@shared/contracts'

// ─── Spot ────────────────────────────────────────────────────────────────────

export const makeSpot = (overrides: Partial<Spot> = {}): Spot => ({
  id: 'spot-1',
  slug: 'spot-1',
  name: 'Test Spot',
  description: 'A test spot',
  location: { lat: 51.5, lon: 7.5 },
  options: {
    discoveryRadius: 50,
    clueRadius: 200,
    visibility: 'public',
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: 'creator-1',
  ...overrides,
})

// ─── Discovery ───────────────────────────────────────────────────────────────

export const makeDiscovery = (overrides: Partial<Discovery> = {}): Discovery => ({
  id: 'discovery-1',
  accountId: 'user-1',
  spotId: 'spot-1',
  trailId: 'trail-1',
  discoveredAt: new Date('2024-01-01T10:00:00'),
  createdAt: new Date('2024-01-01T10:00:00'),
  updatedAt: new Date('2024-01-01T10:00:00'),
  ...overrides,
})

// ─── Trail ───────────────────────────────────────────────────────────────────

export const makeTrail = (overrides: Partial<Trail> = {}): Trail => ({
  id: 'trail-1',
  slug: 'trail-1',
  name: 'Test Trail',
  description: 'A test trail',
  map: {},
  boundary: null,
  options: {
    scannerRadius: 100,
    discoveryMode: 'free',
    previewMode: 'hidden',
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

// ─── ScanEvent ────────────────────────────────────────────────────────────────

export const makeScanEvent = (overrides: Partial<ScanEvent> = {}): ScanEvent => ({
  id: 'scan-1',
  accountId: 'user-1',
  trailId: 'trail-1',
  scannedAt: new Date(),
  radiusUsed: 100,
  successful: true,
  clues: [],
  location: { lat: 51.5, lon: 7.5 },
  createdAt: new Date(),
  ...overrides,
})

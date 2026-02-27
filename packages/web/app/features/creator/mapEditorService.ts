import { api } from "../../api/adminClient.ts";
import type { SpotFormData } from "./SpotForm.tsx";
import type { Boundary, Spot, Trail } from "./mapEditorStore.ts";

// --- Response types (API returns { data: T[] }) ---

interface ApiListResponse<T> {
  data: T[];
}

// --- Spot operations ---

/** Load all spots from the API */
export const fetchSpots = async (): Promise<Spot[]> => {
  const result = await api.spots.list() as ApiListResponse<Spot>;
  return result?.data ?? [];
};

/** Load a single spot with full detail (including contentBlocks) */
export const fetchSpot = async (id: string): Promise<Spot | null> => {
  const result = await api.spots.get(id) as { data?: Spot };
  return result?.data ?? null;
};

/** Create a new spot */
export const createSpot = async (data: SpotFormData) => {
  await api.spots.create({
    content: {
      name: data.name,
      description: data.description,
      imageBase64: data.imageBase64,
      contentBlocks: data.contentBlocks.length > 0
        ? data.contentBlocks
        : undefined,
    },
    location: { lat: data.location.lat, lon: data.location.lon },
    visibility: data.visibility,
    trailIds: data.trailIds.length > 0 ? data.trailIds : undefined,
    consent: true,
  });
};

/** Update an existing spot */
export const updateSpot = async (id: string, data: SpotFormData) => {
  await api.spots.update(id, {
    content: {
      name: data.name,
      description: data.description,
      imageBase64: data.imageBase64,
      contentBlocks: data.contentBlocks,
    },
    visibility: data.visibility,
    trailIds: data.trailIds.length > 0 ? data.trailIds : undefined,
  });
};

/** Delete a spot */
export const deleteSpot = async (id: string) => {
  await api.spots.delete(id);
};

// --- Trail operations ---

interface CreateTrailData {
  name: string;
  description: string;
  boundary: Boundary;
  discoveryMode: 'free' | 'sequence';
  imageBase64?: string;
  mapImageBase64?: string;
}

interface UpdateTrailData {
  name: string;
  description: string;
  boundary: Boundary;
  discoveryMode: 'free' | 'sequence';
  imageBase64?: string;
  mapImageBase64?: string;
}

const DEFAULT_TRAIL_OPTIONS = {
  scannerRadius: 200,
  snapRadius: 50,
  previewMode: "preview" as const,
};

interface TrailSpot { spotId: string; order?: number }

/** Load all trails from the API, enriched with their spot IDs sorted by order */
export const fetchTrails = async (createdBy?: string): Promise<Trail[]> => {
  const result = await api.trails.list({ createdBy }) as ApiListResponse<Trail>;
  const trails = result?.data ?? [];

  // Fetch spot IDs for each trail in parallel
  const trailsWithSpots = await Promise.all(
    trails.map(async (trail) => {
      const spotsResult = await api.trails.getSpots(trail.id) as { data?: TrailSpot[] };
      const sorted = (spotsResult?.data ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return { ...trail, spotIds: sorted.map((ts) => ts.spotId) };
    }),
  );

  return trailsWithSpots;
};

/**
 * Reorder spots in a trail by sequentially removing and re-adding with new order indices.
 * orderedSpotIds defines the desired order (index = new order value).
 */
export const reorderTrailSpots = async (trailId: string, orderedSpotIds: string[]) => {
  for (let i = 0; i < orderedSpotIds.length; i++) {
    const spotId = orderedSpotIds[i];
    await api.trails.removeSpot(trailId, spotId);
    await api.trails.addSpot(trailId, spotId, i);
  }
};

/** Create a new trail */
export const createTrail = async (data: CreateTrailData) => {
  await api.trails.create({
    name: data.name,
    description: data.description,
    boundary: data.boundary,
    map: {},
    imageBase64: data.imageBase64,
    mapImageBase64: data.mapImageBase64,
    options: { ...DEFAULT_TRAIL_OPTIONS, discoveryMode: data.discoveryMode },
  });
};

/** Update an existing trail */
export const updateTrail = async (id: string, data: UpdateTrailData) => {
  await api.trails.update(id, {
    name: data.name,
    description: data.description,
    boundary: data.boundary,
    imageBase64: data.imageBase64,
    mapImageBase64: data.mapImageBase64,
    options: { ...DEFAULT_TRAIL_OPTIONS, discoveryMode: data.discoveryMode },
  });
};

/** Delete a trail */
export const deleteTrail = async (id: string) => {
  await api.trails.delete(id);
};

// --- Data loading ---

/** Load all spots and trails in parallel */
export const fetchAllData = async (createdBy?: string): Promise<
  { spots: Spot[]; trails: Trail[] }
> => {
  const [spots, trails] = await Promise.all([fetchSpots(), fetchTrails(createdBy)]);
  return { spots, trails };
};

import { adminApi } from "../../api/adminClient.ts";
import type { SpotFormData } from "./SpotForm.tsx";
import type { Boundary, Spot, Trail } from "./mapEditorStore.ts";

// --- Response types (API returns { data: T[] }) ---

interface ApiListResponse<T> {
  data: T[];
}

// --- Spot operations ---

/** Load all spots from the API */
export const fetchSpots = async (): Promise<Spot[]> => {
  const result = await adminApi.getSpots() as ApiListResponse<Spot>;
  return result?.data ?? [];
};

/** Load a single spot with full detail (including contentBlocks) */
export const fetchSpot = async (id: string): Promise<Spot | null> => {
  const result = await adminApi.getSpot(id) as { data?: Spot };
  return result?.data ?? null;
};

/** Create a new spot */
export const createSpot = async (data: SpotFormData) => {
  await adminApi.createSpot({
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
  await adminApi.updateSpot(id, {
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
  await adminApi.deleteSpot(id);
};

// --- Trail operations ---

interface CreateTrailData {
  name: string;
  description: string;
  boundary: Boundary;
  imageBase64?: string;
  mapImageBase64?: string;
}

interface UpdateTrailData {
  name: string;
  description: string;
  boundary: Boundary;
  imageBase64?: string;
  mapImageBase64?: string;
}

const DEFAULT_TRAIL_OPTIONS = {
  scannerRadius: 200,
  snapRadius: 50,
  discoveryMode: "free" as const,
  previewMode: "preview" as const,
};

interface TrailSpot { spotId: string }

/** Load all trails from the API, enriched with their spot IDs */
export const fetchTrails = async (): Promise<Trail[]> => {
  const result = await adminApi.getTrails() as ApiListResponse<Trail>;
  const trails = result?.data ?? [];

  // Fetch spot IDs for each trail in parallel
  const trailsWithSpots = await Promise.all(
    trails.map(async (trail) => {
      const spotsResult = await adminApi.getTrailSpots(trail.id) as { data?: TrailSpot[] };
      return { ...trail, spotIds: (spotsResult?.data ?? []).map((ts) => ts.spotId) };
    }),
  );

  return trailsWithSpots;
};

/** Create a new trail */
export const createTrail = async (data: CreateTrailData) => {
  await adminApi.createTrail({
    name: data.name,
    description: data.description,
    boundary: data.boundary,
    map: {},
    imageBase64: data.imageBase64,
    mapImageBase64: data.mapImageBase64,
    options: DEFAULT_TRAIL_OPTIONS,
  });
};

/** Update an existing trail */
export const updateTrail = async (id: string, data: UpdateTrailData) => {
  await adminApi.updateTrail(id, {
    name: data.name,
    description: data.description,
    boundary: data.boundary,
    imageBase64: data.imageBase64,
    mapImageBase64: data.mapImageBase64,
  });
};

/** Delete a trail */
export const deleteTrail = async (id: string) => {
  await adminApi.deleteTrail(id);
};

// --- Data loading ---

/** Load all spots and trails in parallel */
export const fetchAllData = async (): Promise<
  { spots: Spot[]; trails: Trail[] }
> => {
  const [spots, trails] = await Promise.all([fetchSpots(), fetchTrails()]);
  return { spots, trails };
};

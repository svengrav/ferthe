import type { GeoBoundary } from "@shared/geo/types.ts";
import { create } from "zustand";
import { ContentBlock } from "./ContentBlockEditorList.tsx";

// --- Types ---

export type Boundary = GeoBoundary;

export interface Spot {
  id: string;
  name: string;
  location: { lat: number; lon: number };
  description?: string;
  image?: { id: string; url: string };
  contentBlocks?: ContentBlock[];
  options?: { visibility?: string };
  trailIds?: string[];
}

export interface Trail {
  id: string;
  name: string;
  description?: string;
  image?: { id: string; url: string };
  map?: { image?: { id: string; url: string } };
  viewport?: { image?: { id: string; url: string } };
  boundary: Boundary;
  spotIds?: string[];
  options?: { discoveryMode?: 'free' | 'sequence' };
}

export type EditorMode =
  | "view"
  | "create-spot"
  | "create-trail"
  | "edit-spot"
  | "edit-trail";

export type SelectedItem =
  | { type: "spot"; item: Spot }
  | { type: "trail"; item: Trail }
  | null;

interface MapEditorState {
  // Data
  spots: Spot[];
  trails: Trail[];
  loading: boolean;
  error: string;

  // UI state
  mode: EditorMode;
  selectedItem: SelectedItem;
  activeTrailIds: Set<string>;
  newSpotLocation: { lat: number; lng: number } | null;
  editableSpotLocation: { lat: number; lon: number } | null;
  editableBounds: Boundary | null;
  showSpots: boolean;
  showTrails: boolean;
}

interface MapEditorActions {
  // Data actions
  setSpots: (spots: Spot[]) => void;
  setTrails: (trails: Trail[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;

  // UI actions
  setMode: (mode: EditorMode) => void;
  selectSpot: (spot: Spot) => void;
  selectTrail: (trail: Trail) => void;
  clearSelection: () => void;
  toggleActiveTrail: (id: string) => void;
  setNewSpotLocation: (location: { lat: number; lng: number } | null) => void;
  setEditableSpotLocation: (location: { lat: number; lon: number } | null) => void;
  setEditableBounds: (bounds: Boundary | null) => void;
  setShowSpots: (show: boolean) => void;
  setShowTrails: (show: boolean) => void;
  updateTrailSpotIds: (trailId: string, spotIds: string[]) => void;

  // Compound actions
  resetToView: () => void;
}

export const useMapEditorStore = create<MapEditorState & MapEditorActions>(
  (set) => ({
    // Initial state
    spots: [],
    trails: [],
    loading: true,
    error: "",
    mode: "view",
    selectedItem: null,
    activeTrailIds: new Set<string>(),
    newSpotLocation: null,
    editableSpotLocation: null,
    editableBounds: null,
    showSpots: true,
    showTrails: true,

    // Data actions
    setSpots: (spots) => set({ spots }),
    setTrails: (trails) => set({ trails }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // UI actions
    setMode: (mode) => set({ mode }),
    selectSpot: (spot) =>
      set({
        selectedItem: { type: "spot", item: spot },
        editableSpotLocation: spot.location,
        mode: "view",
      }),
    selectTrail: (trail) =>
      set({
        selectedItem: { type: "trail", item: trail },
        editableBounds: trail.boundary,
        mode: "view",
      }),
    clearSelection: () => set({ selectedItem: null, editableSpotLocation: null, editableBounds: null }),
    toggleActiveTrail: (id) =>
      set((state) => {
        const next = new Set(state.activeTrailIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { activeTrailIds: next };
      }),
    setNewSpotLocation: (location) => set({ newSpotLocation: location }),
    setEditableSpotLocation: (location) => set({ editableSpotLocation: location }),
    setEditableBounds: (bounds) => set({ editableBounds: bounds }),
    setShowSpots: (show) => set({ showSpots: show }),
    setShowTrails: (show) => set({ showTrails: show }),
    updateTrailSpotIds: (trailId, spotIds) =>
      set((state) => ({
        trails: state.trails.map((t) =>
          t.id === trailId ? { ...t, spotIds } : t
        ),
        selectedItem:
          state.selectedItem?.type === "trail" &&
            state.selectedItem.item.id === trailId
            ? { type: "trail", item: { ...state.selectedItem.item, spotIds } }
            : state.selectedItem,
      })),

    // Compound actions
    resetToView: () =>
      set({
        mode: "view",
        selectedItem: null,
        newSpotLocation: null,
        editableSpotLocation: null,
        editableBounds: null,
        activeTrailIds: new Set(),
      }),
  }),
);

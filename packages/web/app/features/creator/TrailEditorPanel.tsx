import { useEffect, useState } from "react";

import { useRemoveDialog } from "../../hooks/useRemoveDialog.tsx";
import { TrailForm } from "./TrailForm.tsx";
import * as service from "./mapEditorService.ts";
import type { Boundary, Spot, Trail } from "./mapEditorStore.ts";
import { useMapEditorStore } from "./mapEditorStore.ts";
import { DeleteButton, ErrorMessage, PanelHeader } from "./ui/index.ts";

interface TrailEditorPanelProps {
  editableRectRef: React.RefObject<google.maps.Rectangle | null>;
  onDataChanged: () => Promise<void>;
}

/**
 * Panel for creating and editing trails.
 * Reads mode/selection/bounds from store, calls service for API.
 */
export function TrailEditorPanel(props: TrailEditorPanelProps) {
  const { editableRectRef, onDataChanged } = props;

  const {
    mode,
    spots,
    selectedItem,
    editableBounds,
    setEditableBounds,
    resetToView,
    clearSelection,
    updateTrailSpotIds,
  } = useMapEditorStore();

  const [error, setError] = useState("");
  const [currentDiscoveryMode, setCurrentDiscoveryMode] = useState<
    "free" | "sequence"
  >(
    selectedItem?.type === "trail"
      ? (selectedItem.item.options?.discoveryMode ?? "free")
      : "free",
  );
  const { openDialog: openRemoveDialog } = useRemoveDialog();

  // Sync discoveryMode when a different trail is selected
  const selectedTrailId = selectedItem?.type === "trail"
    ? selectedItem.item.id
    : null;
  useEffect(() => {
    if (selectedItem?.type === "trail") {
      setCurrentDiscoveryMode(
        selectedItem.item.options?.discoveryMode ?? "free",
      );
    }
  }, [selectedTrailId]);

  /** Sync boundary change to both store and map rectangle */
  const handleBoundaryChange = (b: Boundary) => {
    setEditableBounds(b);
    editableRectRef.current?.setBounds({
      north: b.northEast.lat,
      south: b.southWest.lat,
      east: b.northEast.lon,
      west: b.southWest.lon,
    });
  };

  // --- Create Trail ---
  const handleCreate = async (data: any) => {
    await service.createTrail(data);
    resetToView();
    await onDataChanged();
  };

  // --- Update Trail ---
  const handleUpdate = async (data: any) => {
    if (selectedItem?.type !== "trail") return;
    const trail = selectedItem.item as Trail;
    await Promise.all([
      service.updateTrail(trail.id, data),
      service.reorderTrailSpots(trail.id, trail.spotIds ?? []),
    ]);
    resetToView();
    await onDataChanged();
  };

  // --- Delete Trail ---
  const handleDelete = () => {
    if (selectedItem?.type !== "trail") return;
    openRemoveDialog({
      title: "Delete Trail",
      message: `Are you sure you want to delete "${selectedItem.item.name}"?`,
      onConfirm: async () => {
        try {
          await service.deleteTrail(selectedItem.item.id);
          clearSelection();
          await onDataChanged();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to delete trail",
          );
        }
      },
    });
  };

  // Create trail mode
  if (mode === "create-trail") {
    return (
      <div>
        <PanelHeader title="Create Trail" onClose={resetToView} />
        <p className="text-xs text-gray-400 mb-3">
          Drag the rectangle on the map or resize its handles to define the
          trail boundary.
        </p>
        <TrailForm
          boundary={editableBounds ?? undefined}
          onBoundaryChange={handleBoundaryChange}
          onSubmit={handleCreate}
          onCancel={resetToView}
        />
      </div>
    );
  }

  // Edit trail mode
  if (mode === "view" && selectedItem?.type === "trail") {
    const trail = selectedItem.item as Trail;

    // Spots assigned to this trail, in current order
    const orderedSpots = (trail.spotIds ?? [])
      .map((id) => spots.find((s) => s.id === id))
      .filter(Boolean) as Spot[];

    const handleMoveSpot = (index: number, direction: -1 | 1) => {
      const newOrder = [...(trail.spotIds ?? [])];
      const target = index + direction;
      if (target < 0 || target >= newOrder.length) return;
      [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
      updateTrailSpotIds(trail.id, newOrder);
    };

    return (
      <div>
        <PanelHeader
          title="Edit Trail"
          onClose={() => {
            clearSelection();
          }}
        />
        <p className="text-xs text-gray-400 mb-3">
          Drag or resize the yellow rectangle on the map to adjust the boundary.
        </p>
        <TrailForm
          key={`edit-${trail.id}`}
          initialData={{
            name: trail.name,
            description: trail.description,
            discoveryMode: trail.options?.discoveryMode ?? "free",
          }}
          existingImageUrl={trail.image?.url}
          existingMapImageUrl={trail.map?.image?.url}
          existingCanvasImageUrl={trail.viewport?.image?.url}
          boundary={editableBounds ?? trail.boundary}
          onBoundaryChange={handleBoundaryChange}
          onDiscoveryModeChange={setCurrentDiscoveryMode}
          onSubmit={handleUpdate}
          onCancel={clearSelection}
        />

        {/* Spot order — only for sequence mode */}
        {currentDiscoveryMode === "sequence" && orderedSpots.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Spot Order ({orderedSpots.length})
            </h4>
            <div className="space-y-1">
              {orderedSpots.map((spot, i) => (
                <div
                  key={spot.id}
                  className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5 text-sm"
                >
                  <span className="text-gray-400 w-5 text-right shrink-0">
                    {i + 1}.
                  </span>
                  <span className="flex-1 truncate text-gray-700">
                    {spot.name}
                  </span>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => handleMoveSpot(i, -1)}
                    className="px-1.5 py-0.5 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === orderedSpots.length - 1}
                    onClick={() => handleMoveSpot(i, 1)}
                    className="px-1.5 py-0.5 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <ErrorMessage error={error} />
        <DeleteButton onClick={handleDelete} label="Delete Trail" />
      </div>
    );
  }

  return null;
}

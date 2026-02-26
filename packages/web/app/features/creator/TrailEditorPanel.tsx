import { useState } from "react";

import { useRemoveDialog } from "../../hooks/useRemoveDialog.tsx";
import { TrailForm } from "./TrailForm.tsx";
import * as service from "./mapEditorService.ts";
import type { Boundary, Trail } from "./mapEditorStore.ts";
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
    selectedItem,
    editableBounds,
    setEditableBounds,
    resetToView,
    clearSelection,
  } = useMapEditorStore();

  const [error, setError] = useState("");
  const { openDialog: openRemoveDialog } = useRemoveDialog();

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
    await service.updateTrail(selectedItem.item.id, data);
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
          }}
          existingImageUrl={trail.image?.url}
          existingMapImageUrl={trail.map?.image?.url}
          boundary={editableBounds ?? trail.boundary}
          onBoundaryChange={handleBoundaryChange}
          onSubmit={handleUpdate}
          onCancel={clearSelection}
        />
        <ErrorMessage error={error} />
        <DeleteButton onClick={handleDelete} label="Delete Trail" />
      </div>
    );
  }

  return null;
}

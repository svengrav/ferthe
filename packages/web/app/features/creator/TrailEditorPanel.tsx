import { useState } from "react";
import { useRemoveDialog } from "../../hooks/useRemoveDialog.tsx";
import { TrailForm } from "./TrailForm.tsx";
import * as service from "./mapEditorService.ts";
import type { Boundary, Trail } from "./mapEditorStore.ts";
import { useMapEditorStore } from "./mapEditorStore.ts";

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
    try {
      await service.createTrail(data);
      resetToView();
      await onDataChanged();
    } catch (err) {
      throw err;
    }
  };

  // --- Update Trail ---
  const handleUpdate = async (data: any) => {
    if (selectedItem?.type !== "trail") return;
    try {
      await service.updateTrail(selectedItem.item.id, data);
      resetToView();
      await onDataChanged();
    } catch (err) {
      throw err;
    }
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
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <button
          type="button"
          onClick={handleDelete}
          className="w-full mt-4 px-4 py-2 bg-danger rounded hover:bg-danger/90 text-white"
        >
          Delete Trail
        </button>
      </div>
    );
  }

  return null;
}

// --- Shared panel header ---

function PanelHeader(props: { title: string; onClose: () => void }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg">{props.title}</h3>
      <button
        type="button"
        onClick={props.onClose}
        className="text-gray-400 hover:text-primary"
      >
        ✕
      </button>
    </div>
  );
}

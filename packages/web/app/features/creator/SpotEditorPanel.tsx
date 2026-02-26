import { useEffect, useState } from "react";
import { useRemoveDialog } from "../../hooks/useRemoveDialog.tsx";
import type { SpotFormData } from "./SpotForm.tsx";
import { SpotForm } from "./SpotForm.tsx";
import * as service from "./mapEditorService.ts";
import type { Spot } from "./mapEditorStore.ts";
import { useMapEditorStore } from "./mapEditorStore.ts";

/**
 * Panel for creating and editing spots.
 * Reads mode/selection from store, calls service for API, updates store on success.
 */
export function SpotEditorPanel(props: { onDataChanged: () => Promise<void> }) {
  const { onDataChanged } = props;

  const {
    mode,
    selectedItem,
    newSpotLocation,
    editableSpotLocation,
    trails,
    activeTrailId,
    setEditableSpotLocation,
    resetToView,
    clearSelection,
  } = useMapEditorStore();

  const [error, setError] = useState("");
  const [detailedSpot, setDetailedSpot] = useState<Spot | null>(null);
  const { openDialog: openRemoveDialog } = useRemoveDialog();

  // Fetch full spot detail (includes contentBlocks) when a spot is selected for editing
  const editingSpotId = selectedItem?.type === "spot"
    ? selectedItem.item.id
    : null;
  useEffect(() => {
    if (!editingSpotId) {
      setDetailedSpot(null);
      return;
    }
    setDetailedSpot(null);
    service.fetchSpot(editingSpotId).then((spot) => {
      if (spot) setDetailedSpot(spot);
    });
  }, [editingSpotId]);

  const trailOptions = trails.map((t) => ({ id: t.id, name: t.name }));

  // Derive which trails the selected spot belongs to from loaded trail data
  const editingSpotTrailIds = selectedItem?.type === "spot"
    ? trails.filter((t) => t.spotIds?.includes(selectedItem.item.id)).map((t) =>
      t.id
    )
    : [];

  // --- Create Spot ---
  const handleCreate = async (data: SpotFormData) => {
    try {
      await service.createSpot(data);
      resetToView();
      await onDataChanged();
    } catch (err) {
      throw err;
    }
  };

  // --- Update Spot ---
  const handleUpdate = async (data: SpotFormData) => {
    if (selectedItem?.type !== "spot") return;
    try {
      await service.updateSpot(selectedItem.item.id, data);
      resetToView();
      await onDataChanged();
    } catch (err) {
      throw err;
    }
  };

  // --- Delete Spot ---
  const handleDelete = () => {
    if (selectedItem?.type !== "spot") return;
    openRemoveDialog({
      title: "Delete Spot",
      message: `Are you sure you want to delete "${selectedItem.item.name}"?`,
      onConfirm: async () => {
        try {
          await service.deleteSpot(selectedItem.item.id);
          clearSelection();
          await onDataChanged();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to delete spot",
          );
        }
      },
    });
  };

  // Pre-select active trail for new spots
  const defaultTrailIds = activeTrailId ? [activeTrailId] : [];

  // Create spot mode
  if (mode === "create-spot" && newSpotLocation) {
    return (
      <div>
        <PanelHeader title="Create Spot" onClose={resetToView} />
        <SpotForm
          key={`create-${newSpotLocation.lat}-${newSpotLocation.lng}`}
          initialData={{
            location: { lat: newSpotLocation.lat, lon: newSpotLocation.lng },
            trailIds: defaultTrailIds,
          }}
          trails={trailOptions}
          onSubmit={handleCreate}
          onCancel={resetToView}
        />
      </div>
    );
  }

  // Edit spot mode
  if (mode === "view" && selectedItem?.type === "spot") {
    const spot = selectedItem.item as Spot;
    if (!detailedSpot) {
      return (
        <div>
          <PanelHeader title="Edit Spot" onClose={clearSelection} />
          <p className="text-sm text-gray-400 p-4">Loading…</p>
        </div>
      );
    }
    return (
      <div>
        <PanelHeader title="Edit Spot" onClose={clearSelection} />
        <SpotForm
          key={`edit-${spot.id}`}
          initialData={{
            name: spot.name,
            description: spot.description,
            location: editableSpotLocation ?? spot.location,
            visibility: spot.options?.visibility as SpotFormData["visibility"],
            contentBlocks: detailedSpot.contentBlocks ?? [],
            trailIds: editingSpotTrailIds,
          }}
          existingImageUrl={spot.image?.url}
          trails={trailOptions}
          onLocationChange={setEditableSpotLocation}
          onSubmit={handleUpdate}
          onCancel={clearSelection}
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <button
          type="button"
          onClick={handleDelete}
          className="w-full mt-4 px-4 py-2 bg-danger rounded hover:bg-danger/90"
        >
          Delete Spot
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

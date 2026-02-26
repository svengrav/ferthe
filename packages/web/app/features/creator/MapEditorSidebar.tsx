import type { Boundary, EditorMode, Spot } from "./mapEditorStore.ts";
import { useMapEditorStore } from "./mapEditorStore.ts";

const PLACEHOLDER_BG = "bg-gray-300";

interface MapEditorSidebarProps {
  mapRef: React.RefObject<google.maps.Map | null>;
  getDefaultBounds: () => Boundary;
}

/**
 * Sidebar with mode selection, layer toggles, trail activation, and spot/trail lists with thumbnails.
 */
export function MapEditorSidebar(props: MapEditorSidebarProps) {
  const { mapRef, getDefaultBounds } = props;

  const {
    mode,
    spots,
    trails,
    showSpots,
    showTrails,
    selectedItem,
    activeTrailId,
    setMode,
    selectSpot,
    selectTrail,
    toggleActiveTrail,
    setShowSpots,
    setShowTrails,
    setEditableBounds,
  } = useMapEditorStore();

  const handleModeClick = (newMode: EditorMode) => {
    if (newMode === "create-trail") {
      setEditableBounds(getDefaultBounds());
    }
    setMode(newMode);
  };

  const handleSpotClick = (spot: Spot) => {
    selectSpot(spot);
    mapRef.current?.panTo({ lat: spot.location.lat, lng: spot.location.lon });
  };

  const renderThumbnail = (url?: string) => (
    <div
      className={`w-10 h-10 rounded overflow-hidden shrink-0 ${
        !url ? PLACEHOLDER_BG : ""
      }`}
    >
      {url
        ? (
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        )
        : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            —
          </div>
        )}
    </div>
  );

  return (
    <div className="w-80 bg-white border-r border-gray-300 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Mode Selection */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Mode</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleModeClick("view")}
              className={`flex-1 px-3 py-2 text-sm rounded ${
                mode === "view"
                  ? "bg-primary text-onprimary"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              View
            </button>
            <button
              type="button"
              onClick={() => handleModeClick("create-spot")}
              className={`flex-1 px-3 py-2 text-sm rounded ${
                mode === "create-spot"
                  ? "bg-primary text-onprimary"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              + Spot
            </button>
            <button
              type="button"
              onClick={() => handleModeClick("create-trail")}
              className={`flex-1 px-3 py-2 text-sm rounded ${
                mode === "create-trail"
                  ? "bg-primary text-onprimary"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              + Trail
            </button>
          </div>
          {mode === "create-spot" && (
            <p className="text-xs text-gray-400 mt-2">
              Click on map to place spot
            </p>
          )}
        </div>

        {/* Layer Toggles */}
        <div className="border-t border-gray-300 pt-4">
          <h2 className="text-lg font-semibold mb-2">Layers</h2>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showSpots}
                onChange={(e) => setShowSpots(e.target.checked)}
                className="rounded accent-primary"
              />
              <span>Spots ({spots.length})</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="rounded accent-primary"
              />
              <span>Trails ({trails.length})</span>
            </label>
          </div>
        </div>

        {/* Trail List — always visible, click = activate, edit button for editing */}
        <div className="border-t border-gray-300 pt-4">
          <h3 className="font-semibold mb-2">Trails ({trails.length})</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {trails.map((trail) => {
              const isActive = activeTrailId === trail.id;
              const isEditing = selectedItem?.type === "trail" &&
                selectedItem.item.id === trail.id;
              return (
                <div
                  key={trail.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                    isActive
                      ? "bg-primary text-onprimary"
                      : isEditing
                      ? "bg-gray-200 text-gray-700"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {renderThumbnail(trail.image?.url)}
                  <button
                    type="button"
                    onClick={() => toggleActiveTrail(trail.id)}
                    className="flex-1 text-left truncate"
                  >
                    <div className="font-medium truncate">{trail.name}</div>
                    {isActive && (
                      <div className="text-xs text-onprimary/70">Active</div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTrail(trail)}
                    className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-700 shrink-0"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
            {trails.length === 0 && (
              <p className="text-xs text-gray-400">No trails yet</p>
            )}
          </div>
        </div>

        {/* Spot List — always visible */}
        <div className="border-t border-gray-300 pt-4">
          <h3 className="font-semibold mb-2">Spots ({spots.length})</h3>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {spots.map((spot) => {
              const isSelected = selectedItem?.type === "spot" &&
                selectedItem.item.id === spot.id;
              return (
                <div
                  key={spot.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                    isSelected
                      ? "bg-primary text-onprimary"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {renderThumbnail(spot.image?.url)}
                  <button
                    type="button"
                    onClick={() => handleSpotClick(spot)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="font-medium truncate">{spot.name}</div>
                    <div
                      className={`text-xs truncate ${
                        isSelected ? "text-onprimary/70" : "text-gray-400"
                      }`}
                    >
                      {spot.location.lat.toFixed(5)},{" "}
                      {spot.location.lon.toFixed(5)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => selectSpot(spot)}
                    className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-700 shrink-0"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
            {spots.length === 0 && (
              <p className="text-xs text-gray-400">No spots yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

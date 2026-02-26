import {
  GoogleMap,
  Marker,
  Rectangle,
  useLoadScript,
} from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../../api/adminClient";
import type { SpotFormData } from "./SpotForm";
import { SpotForm } from "./SpotForm";
import { TrailForm } from "./TrailForm";

const GOOGLE_MAPS_API_KEY = "AIzaSyDPPI3WoxR8aQiHvpS_C4rQv56X94EIaog";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 51.9607,
  lng: 7.6261,
};

interface Spot {
  id: string;
  name: string;
  location: { lat: number; lon: number };
  description?: string;
  image?: { id: string; url: string };
  contentBlocks?: any[];
  options?: { visibility?: string };
}

interface Trail {
  id: string;
  name: string;
  description?: string;
  image?: { id: string; url: string };
  map?: { image?: { id: string; url: string } };
  boundary: {
    northEast: { lat: number; lon: number };
    southWest: { lat: number; lon: number };
  };
}

type EditorMode =
  | "view"
  | "create-spot"
  | "create-trail"
  | "edit-spot"
  | "edit-trail";

export function MapEditor() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [spots, setSpots] = useState<Spot[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showSpots, setShowSpots] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [mode, setMode] = useState<EditorMode>("view");
  const [selectedItem, setSelectedItem] = useState<
    { type: "spot" | "trail"; item: Spot | Trail } | null
  >(null);
  const [newSpotLocation, setNewSpotLocation] = useState<
    { lat: number; lng: number } | null
  >(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const editableRectRef = useRef<google.maps.Rectangle | null>(null);

  // Boundary state for create/edit trail mode (editable rectangle on map)
  const [editableBounds, setEditableBounds] = useState<
    {
      northEast: { lat: number; lon: number };
      southWest: { lat: number; lon: number };
    } | null
  >(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const results = await Promise.all([
        adminApi.getSpots(),
        adminApi.getTrails(),
      ]);
      // @ts-expect-error - API response types not yet defined
      setSpots(results[0]?.data || []);
      // @ts-expect-error - API response types not yet defined
      setTrails(results[1]?.data || []);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to load data";
      console.error("Failed to load data:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (mode === "create-spot" && e.latLng) {
      setNewSpotLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  // Read bounds from the editable rectangle instance
  const syncBoundsFromRect = useCallback(() => {
    const rect = editableRectRef.current;
    if (!rect) return;
    const bounds = rect.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    setEditableBounds({
      northEast: { lat: ne.lat(), lon: ne.lng() },
      southWest: { lat: sw.lat(), lon: sw.lng() },
    });
  }, []);

  // Compute default bounds from current map viewport (20% of visible area)
  const getDefaultBoundsFromMap = () => {
    const map = mapRef.current;
    if (!map) {
      return {
        northEast: {
          lat: defaultCenter.lat + 0.005,
          lon: defaultCenter.lng + 0.008,
        },
        southWest: {
          lat: defaultCenter.lat - 0.005,
          lon: defaultCenter.lng - 0.008,
        },
      };
    }
    const mapBounds = map.getBounds();
    if (!mapBounds) {
      const center = map.getCenter()!;
      return {
        northEast: { lat: center.lat() + 0.005, lon: center.lng() + 0.008 },
        southWest: { lat: center.lat() - 0.005, lon: center.lng() - 0.008 },
      };
    }
    const ne = mapBounds.getNorthEast();
    const sw = mapBounds.getSouthWest();
    const latSpan = (ne.lat() - sw.lat()) * 0.2;
    const lngSpan = (ne.lng() - sw.lng()) * 0.2;
    const center = map.getCenter()!;
    return {
      northEast: {
        lat: center.lat() + latSpan / 2,
        lon: center.lng() + lngSpan / 2,
      },
      southWest: {
        lat: center.lat() - latSpan / 2,
        lon: center.lng() - lngSpan / 2,
      },
    };
  };

  const handleCreateSpot = async (data: SpotFormData) => {
    try {
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
      setMode("view");
      setNewSpotLocation(null);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateSpot = async (data: SpotFormData) => {
    if (!selectedItem || selectedItem.type !== "spot") return;
    try {
      await adminApi.updateSpot(selectedItem.item.id, {
        content: {
          name: data.name,
          description: data.description,
          imageBase64: data.imageBase64,
          contentBlocks: data.contentBlocks,
        },
        visibility: data.visibility,
        trailIds: data.trailIds.length > 0 ? data.trailIds : undefined,
      });
      setMode("view");
      setSelectedItem(null);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleCreateTrail = async (data: any) => {
    try {
      await adminApi.createTrail({
        name: data.name,
        description: data.description,
        boundary: data.boundary,
        map: {},
        imageBase64: data.imageBase64,
        mapImageBase64: data.mapImageBase64,
        options: {
          scannerRadius: 200,
          snapRadius: 50,
          discoveryMode: "free",
          previewMode: "preview",
        },
      });
      setMode("view");
      setEditableBounds(null);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateTrail = async (data: any) => {
    if (!selectedItem || selectedItem.type !== "trail") return;
    try {
      await adminApi.updateTrail(selectedItem.item.id, {
        name: data.name,
        description: data.description,
        boundary: data.boundary,
        imageBase64: data.imageBase64,
        mapImageBase64: data.mapImageBase64,
      });
      setMode("view");
      setSelectedItem(null);
      setEditableBounds(null);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteSpot = async (id: string) => {
    if (!confirm("Delete this spot?")) return;
    try {
      await adminApi.deleteSpot(id);
      setSelectedItem(null);
      await loadData();
    } catch (error) {
      console.error("Failed to delete spot:", error);
    }
  };

  const handleDeleteTrail = async (id: string) => {
    if (!confirm("Delete this trail?")) return;
    try {
      await adminApi.deleteTrail(id);
      setSelectedItem(null);
      await loadData();
    } catch (error) {
      console.error("Failed to delete trail:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading Google Maps...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-red-400 mb-4">❌ Failed to load Google Maps</div>
        <div className="text-gray-400 text-sm">{loadError.message}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-red-400 mb-4">❌ Failed to load data</div>
        <div className="text-gray-400 text-sm mb-4">{error}</div>
        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 bg-primary rounded hover:bg-gray-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-300 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Mode Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Mode</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("view")}
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
                onClick={() => setMode("create-spot")}
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
                onClick={() => {
                  setMode("create-trail");
                  setEditableBounds(getDefaultBoundsFromMap());
                }}
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

          {/* Layers */}
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

          {/* Spot List */}
          {showSpots && spots.length > 0 && (
            <div className="border-t border-gray-300 pt-4">
              <h3 className="font-semibold mb-2">Spots</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {spots.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => {
                      setSelectedItem({ type: "spot", item: spot });
                      setMode("view");
                      if (mapRef.current) {
                        mapRef.current.panTo({
                          lat: spot.location.lat,
                          lng: spot.location.lon,
                        });
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedItem?.type === "spot" &&
                        selectedItem?.item.id === spot.id
                        ? "bg-primary"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    <div className="font-medium">{spot.name}</div>
                    <div className="text-xs text-gray-400">
                      {spot.location.lat.toFixed(5)},{" "}
                      {spot.location.lon.toFixed(5)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trail List */}
          {showTrails && trails.length > 0 && (
            <div className="border-t border-gray-300 pt-4">
              <h3 className="font-semibold mb-2">Trails</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {trails.map((trail) => (
                  <button
                    key={trail.id}
                    type="button"
                    onClick={() => {
                      setSelectedItem({ type: "trail", item: trail });
                      setEditableBounds(trail.boundary);
                      setMode("view");
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedItem?.type === "trail" &&
                        selectedItem?.item.id === trail.id
                        ? "bg-purple-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {trail.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={13}
          onClick={handleMapClick}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {/* Render Spots */}
          {showSpots && spots.map((spot) => (
            <Marker
              key={spot.id}
              position={{ lat: spot.location.lat, lng: spot.location.lon }}
              onClick={() => {
                setSelectedItem({ type: "spot", item: spot });
                setMode("view");
              }}
              label={spot.name}
            />
          ))}

          {/* Render Trails as Rectangles */}
          {showTrails && trails.map((trail) => {
            const isEditing = mode === "view" &&
              selectedItem?.type === "trail" &&
              selectedItem.item.id === trail.id;

            // Editing trail: render separate editable rectangle
            if (isEditing) {
              return (
                <Rectangle
                  key={`edit-${trail.id}`}
                  options={{
                    strokeColor: "#facc15",
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    fillColor: "#facc15",
                    fillOpacity: 0.15,
                    editable: true,
                    draggable: true,
                  }}
                  onLoad={(rect) => {
                    editableRectRef.current = rect;
                    const b = editableBounds ?? trail.boundary;
                    rect.setBounds({
                      north: b.northEast.lat,
                      south: b.southWest.lat,
                      east: b.northEast.lon,
                      west: b.southWest.lon,
                    });
                  }}
                  onUnmount={() => {
                    editableRectRef.current = null;
                  }}
                  onBoundsChanged={syncBoundsFromRect}
                />
              );
            }

            // Non-editing trail: static rectangle, no events that trigger state
            return (
              <Rectangle
                key={trail.id}
                bounds={{
                  north: trail.boundary.northEast.lat,
                  south: trail.boundary.southWest.lat,
                  east: trail.boundary.northEast.lon,
                  west: trail.boundary.southWest.lon,
                }}
                options={{
                  strokeColor: "#9333EA",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: "#9333EA",
                  fillOpacity: 0.2,
                  editable: false,
                  draggable: false,
                }}
                onClick={() => {
                  setSelectedItem({ type: "trail", item: trail });
                  setEditableBounds(trail.boundary);
                  setMode("view");
                }}
              />
            );
          })}

          {/* Editable Rectangle for new trail creation */}
          {mode === "create-trail" && editableBounds && (
            <Rectangle
              options={{
                strokeColor: "#22c55e",
                strokeOpacity: 0.9,
                strokeWeight: 3,
                fillColor: "#22c55e",
                fillOpacity: 0.15,
                editable: true,
                draggable: true,
              }}
              onLoad={(rect) => {
                editableRectRef.current = rect;
                rect.setBounds({
                  north: editableBounds.northEast.lat,
                  south: editableBounds.southWest.lat,
                  east: editableBounds.northEast.lon,
                  west: editableBounds.southWest.lon,
                });
              }}
              onUnmount={() => {
                editableRectRef.current = null;
              }}
              onBoundsChanged={syncBoundsFromRect}
            />
          )}

          {/* New Spot Location Marker */}
          {newSpotLocation && (
            <Marker
              position={newSpotLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
              }}
            />
          )}
        </GoogleMap>

        {/* Editor Sidebar */}
        {(mode === "create-spot" && newSpotLocation) ||
            mode === "create-trail" || (mode === "view" && selectedItem)
          ? (
            <div className="absolute w-full max-w-md top-4 right-0 bg-white rounded-lg p-4 max-h-[calc(100%-2rem)] overflow-y-auto">
              {/* Create Spot Form */}
              {mode === "create-spot" && newSpotLocation && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Create Spot</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("view");
                        setNewSpotLocation(null);
                      }}
                      className="text-gray-400 hover:text-primary"
                    >
                      ✕
                    </button>
                  </div>
                  <SpotForm
                    key={`create-${newSpotLocation.lat}-${newSpotLocation.lng}`}
                    initialData={{
                      location: {
                        lat: newSpotLocation.lat,
                        lon: newSpotLocation.lng,
                      },
                    }}
                    trails={trails.map((t) => ({ id: t.id, name: t.name }))}
                    onSubmit={handleCreateSpot}
                    onCancel={() => {
                      setMode("view");
                      setNewSpotLocation(null);
                    }}
                  />
                </div>
              )}

              {/* Create Trail Form */}
              {mode === "create-trail" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Create Trail</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("view");
                        setEditableBounds(null);
                      }}
                      className="text-gray-400 hover:text-primary"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    Drag the rectangle on the map or resize its handles to
                    define the trail boundary.
                  </p>
                  <TrailForm
                    boundary={editableBounds ?? undefined}
                    onBoundaryChange={(b) => {
                      setEditableBounds(b);
                      editableRectRef.current?.setBounds({
                        north: b.northEast.lat,
                        south: b.southWest.lat,
                        east: b.northEast.lon,
                        west: b.southWest.lon,
                      });
                    }}
                    onSubmit={handleCreateTrail}
                    onCancel={() => {
                      setMode("view");
                      setEditableBounds(null);
                    }}
                  />
                </div>
              )}

              {/* Edit Spot */}
              {mode === "view" && selectedItem?.type === "spot" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Edit Spot</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="text-gray-400 hover:text-primary"
                    >
                      ✕
                    </button>
                  </div>
                  <SpotForm
                    key={`edit-${selectedItem.item.id}`}
                    initialData={{
                      name: selectedItem.item.name,
                      description: (selectedItem.item as Spot).description,
                      location: (selectedItem.item as Spot).location,
                      visibility: (selectedItem.item as Spot).options
                        ?.visibility as any,
                      contentBlocks:
                        (selectedItem.item as Spot).contentBlocks ?? [],
                    }}
                    existingImageUrl={(selectedItem.item as Spot).image?.url}
                    trails={trails.map((t) => ({ id: t.id, name: t.name }))}
                    onSubmit={handleUpdateSpot}
                    onCancel={() => setSelectedItem(null)}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteSpot(selectedItem.item.id)}
                    className="w-full mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                  >
                    Delete Spot
                  </button>
                </div>
              )}

              {/* Edit Trail */}
              {mode === "view" && selectedItem?.type === "trail" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Edit Trail</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem(null);
                        setEditableBounds(null);
                      }}
                      className="text-gray-400 hover:text-primary"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    Drag or resize the yellow rectangle on the map to adjust the
                    boundary.
                  </p>
                  <TrailForm
                    key={`edit-${selectedItem.item.id}`}
                    initialData={{
                      name: selectedItem.item.name,
                      description: (selectedItem.item as Trail).description,
                    }}
                    existingImageUrl={(selectedItem.item as Trail).image?.url}
                    existingMapImageUrl={(selectedItem.item as Trail).map?.image
                      ?.url}
                    boundary={editableBounds ??
                      (selectedItem.item as Trail).boundary}
                    onBoundaryChange={(b) => {
                      setEditableBounds(b);
                      editableRectRef.current?.setBounds({
                        north: b.northEast.lat,
                        south: b.southWest.lat,
                        east: b.northEast.lon,
                        west: b.southWest.lon,
                      });
                    }}
                    onSubmit={handleUpdateTrail}
                    onCancel={() => {
                      setSelectedItem(null);
                      setEditableBounds(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteTrail(selectedItem.item.id)}
                    className="w-full mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                  >
                    Delete Trail
                  </button>
                </div>
              )}
            </div>
          )
          : null}
      </div>
    </div>
  );
}

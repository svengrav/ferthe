import {
  Autocomplete,
  GoogleMap,
  type Libraries,
  OverlayView,
  Rectangle,
  useLoadScript,
} from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapEditorSidebar } from "./MapEditorSidebar.tsx";
import { SpotEditorPanel } from "./SpotEditorPanel.tsx";
import { SpotMapCard } from "./SpotMapCard.tsx";
import { TrailEditorPanel } from "./TrailEditorPanel.tsx";
import * as service from "./mapEditorService.ts";
import type { Boundary } from "./mapEditorStore.ts";
import { useMapEditorStore } from "./mapEditorStore.ts";

const GOOGLE_MAPS_API_KEY = "AIzaSyDPPI3WoxR8aQiHvpS_C4rQv56X94EIaog";

// Stable reference required — must not be defined inline in the component
const LIBRARIES: Libraries = ["places"];

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 51.9607, lng: 7.6261 };
const VIEWPORT_BOUNDS_RATIO = 0.2;
const DEFAULT_OFFSET = { lat: 0.005, lng: 0.008 };

const MAP_IMAGE_OPACITY = 0.45;

/**
 * Native GroundOverlay wrapper — manages google.maps.GroundOverlay imperatively
 * because the @react-google-maps/api wrapper does not reliably apply prop changes after mount.
 */
interface NativeGroundOverlayProps {
  map: google.maps.Map | null;
  url: string;
  bounds: google.maps.LatLngBoundsLiteral;
  opacity: number;
}

function NativeGroundOverlay(props: NativeGroundOverlayProps) {
  const { map, url, bounds, opacity } = props;
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null);

  // Create and destroy overlay with the map instance
  useEffect(() => {
    if (!map) return;
    const overlay = new google.maps.GroundOverlay(url, bounds, {
      opacity,
      clickable: false,
    });
    overlay.setMap(map);
    overlayRef.current = overlay;
    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
    // url/bounds/map changes recreate the overlay; opacity is handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, url, bounds.north, bounds.south, bounds.east, bounds.west]);

  // Update opacity imperatively without recreating the overlay
  useEffect(() => {
    overlayRef.current?.setOpacity(opacity);
  }, [opacity]);

  return null;
}

/**
 * Main map editor component.
 * Composes sidebar, map, and editor panels. Owns Google Maps refs.
 */
interface MapEditorProps {
  accountId?: string;
}

export function MapEditor({ accountId }: MapEditorProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const {
    spots,
    trails,
    loading,
    error,
    mode,
    selectedItem,
    newSpotLocation,
    editableBounds,
    showSpots,
    showTrails,
    activeTrailIds,
    editableSpotLocation,
    setSpots,
    setTrails,
    setLoading,
    setError,
    setNewSpotLocation,
    setEditableSpotLocation,
    setEditableBounds,
    selectSpot,
    selectTrail,
  } = useMapEditorStore();

  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Pan to the selected place and zoom in
  const handlePlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    mapRef.current?.panTo(place.geometry.location);
    mapRef.current?.setZoom(15);
  }, []);
  const editableRectRef = useRef<google.maps.Rectangle | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Native refs for imperative visibility control (options prop updates don't work reliably after mount)
  const trailRectRefs = useRef<Map<string, google.maps.Rectangle>>(new Map());
  // NativeGroundOverlay handles its own lifecycle; no ref map needed

  // Imperatively toggle Rectangle visibility when showTrails or activeTrailIds changes
  useEffect(() => {
    trailRectRefs.current.forEach((rect, key) => {
      const trailId = key.startsWith("edit-") ? key.slice(5) : key;
      rect.setOptions({ visible: showTrails && activeTrailIds.has(trailId) });
    });
  }, [showTrails, activeTrailIds]);

  // --- Data loading ---

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { spots, trails } = await service.fetchAllData(accountId);
      setSpots(spots);
      setTrails(trails);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to load data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSpots, setTrails]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Map interaction handlers ---

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Click: only for placing new spots
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || mode !== "create-spot") return;
    setNewSpotLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  // Long-press (600ms): reposition selected spot
  const LONG_PRESS_DELAY = 600;

  const handleMapMouseDown = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || mode !== "view" || selectedItem?.type !== "spot") return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    longPressTimerRef.current = setTimeout(() => {
      setEditableSpotLocation({ lat, lon: lng });
    }, LONG_PRESS_DELAY);
  };

  /** Sync editable rectangle bounds back to store */
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
  }, [setEditableBounds]);

  /** Compute default bounds from current map viewport */
  const getDefaultBounds = useCallback((): Boundary => {
    const map = mapRef.current;
    if (!map) {
      return {
        northEast: {
          lat: DEFAULT_CENTER.lat + DEFAULT_OFFSET.lat,
          lon: DEFAULT_CENTER.lng + DEFAULT_OFFSET.lng,
        },
        southWest: {
          lat: DEFAULT_CENTER.lat - DEFAULT_OFFSET.lat,
          lon: DEFAULT_CENTER.lng - DEFAULT_OFFSET.lng,
        },
      };
    }
    const mapBounds = map.getBounds();
    const center = map.getCenter()!;
    if (!mapBounds) {
      return {
        northEast: {
          lat: center.lat() + DEFAULT_OFFSET.lat,
          lon: center.lng() + DEFAULT_OFFSET.lng,
        },
        southWest: {
          lat: center.lat() - DEFAULT_OFFSET.lat,
          lon: center.lng() - DEFAULT_OFFSET.lng,
        },
      };
    }
    const ne = mapBounds.getNorthEast();
    const sw = mapBounds.getSouthWest();
    const latSpan = (ne.lat() - sw.lat()) * VIEWPORT_BOUNDS_RATIO;
    const lngSpan = (ne.lng() - sw.lng()) * VIEWPORT_BOUNDS_RATIO;
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
  }, []);

  // --- Determine if editor panel is visible ---

  const showEditorPanel = (mode === "create-spot" && newSpotLocation) ||
    mode === "create-trail" ||
    (mode === "view" && selectedItem);

  // --- Loading / error states ---

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
        <div className="text-red-400 mb-4">Failed to load Google Maps</div>
        <div className="text-gray-400 text-sm">{loadError.message}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-red-400 mb-4">Failed to load data</div>
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
      <MapEditorSidebar mapRef={mapRef} getDefaultBounds={getDefaultBounds} />

      {/* Map Area */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={DEFAULT_CENTER}
          zoom={13}
          onClick={handleMapClick}
          onMouseDown={handleMapMouseDown}
          onMouseUp={cancelLongPress}
          onDrag={cancelLongPress}
          onLoad={(map) => {
            mapRef.current = map;
            setMapInstance(map);
          }}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {/* Spot cards */}
          {showSpots &&
            spots.map((spot) => {
              const isEditing = selectedItem?.type === "spot" &&
                selectedItem.item.id === spot.id;
              const displayLocation = isEditing && editableSpotLocation
                ? {
                  lat: editableSpotLocation.lat,
                  lng: editableSpotLocation.lon,
                }
                : { lat: spot.location.lat, lng: spot.location.lon };

              return (
                <OverlayView
                  key={spot.id}
                  position={displayLocation}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <SpotMapCard
                    spot={spot}
                    isSelected={isEditing}
                    onClick={() => selectSpot(spot)}
                  />
                </OverlayView>
              );
            })}

          {/* Trail map image overlays — NativeGroundOverlay reacts to opacity prop changes imperatively */}
          {trails.map((trail) => {
            const imageUrl = trail.map?.image?.url;
            if (!imageUrl) return null;
            const isEditing = mode === "view" &&
              selectedItem?.type === "trail" &&
              selectedItem.item.id === trail.id;
            const b = isEditing && editableBounds
              ? editableBounds
              : trail.boundary;
            return (
              <NativeGroundOverlay
                key={`mapimg-${trail.id}`}
                map={mapInstance}
                url={imageUrl}
                bounds={{
                  north: b.northEast.lat,
                  south: b.southWest.lat,
                  east: b.northEast.lon,
                  west: b.southWest.lon,
                }}
                opacity={showTrails && activeTrailIds.has(trail.id)
                  ? MAP_IMAGE_OPACITY
                  : 0}
              />
            );
          })}

          {
            /* Trail rectangles — always mounted to avoid Rectangle stacking bug on remount.
               Visibility is controlled imperatively via trailRectRefs + useEffect. */
          }
          {trails.map((trail) => {
            const isEditing = mode === "view" &&
              selectedItem?.type === "trail" &&
              selectedItem.item.id === trail.id;

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
                    visible: showTrails,
                  }}
                  onLoad={(rect) => {
                    editableRectRef.current = rect;
                    trailRectRefs.current.set(`edit-${trail.id}`, rect);
                    rect.setOptions({
                      visible: showTrails && activeTrailIds.has(trail.id),
                    });
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
                    trailRectRefs.current.delete(`edit-${trail.id}`);
                  }}
                  onBoundsChanged={syncBoundsFromRect}
                />
              );
            }

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
                  visible: showTrails && activeTrailIds.has(trail.id),
                }}
                onLoad={(rect) => {
                  trailRectRefs.current.set(trail.id, rect);
                }}
                onUnmount={() => {
                  trailRectRefs.current.delete(trail.id);
                }}
                onClick={() => showTrails && selectTrail(trail)}
              />
            );
          })}

          {/* Editable rectangle for new trail */}
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

          {/* New spot placement card */}
          {newSpotLocation && (
            <OverlayView
              position={newSpotLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <SpotMapCard
                spot={{
                  id: "new",
                  name: "New Spot",
                  location: {
                    lat: newSpotLocation.lat,
                    lon: newSpotLocation.lng,
                  },
                }}
              />
            </OverlayView>
          )}
        </GoogleMap>

        {/* Location Search */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 w-72">
          <Autocomplete
            onLoad={(ac) => {
              autocompleteRef.current = ac;
            }}
            onPlaceChanged={handlePlaceSelect}
          >
            <input
              type="text"
              placeholder="Search location..."
              className="w-full px-3 py-2 text-sm rounded-md shadow bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Autocomplete>
        </div>

        {/* Editor Panel Overlay */}
        {showEditorPanel && (
          <div className="absolute w-full max-w-md top-4 right-0 bg-white rounded-lg p-4 max-h-[calc(100%-2rem)] overflow-y-auto">
            <SpotEditorPanel onDataChanged={loadData} />
            <TrailEditorPanel
              editableRectRef={editableRectRef}
              onDataChanged={loadData}
            />
          </div>
        )}
      </div>
    </div>
  );
}

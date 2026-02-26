import { useEffect, useState } from "react";

import { ImageUpload } from "../../components/ImageUpload.tsx";
import {
  ErrorMessage,
  FormActions,
  FormField,
  INPUT_CLASS,
} from "./ui/index.ts";

interface TrailFormData {
  name: string;
  description: string;
  discoveryMode: "free" | "sequence";
  imageBase64?: string;
  mapImageBase64?: string;
  boundary: {
    northEast: { lat: number; lon: number };
    southWest: { lat: number; lon: number };
  };
}

interface TrailFormProps {
  initialData?: Partial<TrailFormData>;
  /** Existing trail image URL (edit mode) */
  existingImageUrl?: string;
  /** Existing map image URL (edit mode) */
  existingMapImageUrl?: string;
  boundary?: TrailFormData["boundary"];
  onBoundaryChange?: (boundary: TrailFormData["boundary"]) => void;
  onDiscoveryModeChange?: (mode: "free" | "sequence") => void;
  onSubmit: (data: TrailFormData) => Promise<void>;
  onCancel: () => void;
}

export function TrailForm(
  {
    initialData,
    existingImageUrl,
    existingMapImageUrl,
    boundary: externalBoundary,
    onBoundaryChange,
    onDiscoveryModeChange,
    onSubmit,
    onCancel,
  }: TrailFormProps,
) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [discoveryMode, setDiscoveryMode] = useState<"free" | "sequence">(
    initialData?.discoveryMode ?? "free",
  );
  const [imageBase64, setImageBase64] = useState<string | undefined>(
    initialData?.imageBase64,
  );
  const [mapImageBase64, setMapImageBase64] = useState<string | undefined>(
    initialData?.mapImageBase64,
  );
  const [boundary, setBoundary] = useState(
    externalBoundary ?? initialData?.boundary ?? {
      northEast: { lat: 0, lon: 0 },
      southWest: { lat: 0, lon: 0 },
    },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync external boundary from map into form
  useEffect(() => {
    if (externalBoundary) setBoundary(externalBoundary);
  }, [
    externalBoundary?.northEast.lat,
    externalBoundary?.northEast.lon,
    externalBoundary?.southWest.lat,
    externalBoundary?.southWest.lon,
  ]);

  const displayImage = imageBase64 ?? existingImageUrl;
  const displayMapImage = mapImageBase64 ?? existingMapImageUrl;

  // Aspect ratio of map image must match the visual rectangle on the Mercator map.
  // Longitude degrees are shorter than latitude degrees by factor cos(lat),
  // so we correct for that to match the GroundOverlay rendering.
  const mapImageAspectRatio = (() => {
    const lngSpan = boundary.northEast.lon - boundary.southWest.lon;
    const latSpan = boundary.northEast.lat - boundary.southWest.lat;
    if (latSpan <= 0 || lngSpan <= 0) return 1;
    const centerLat = (boundary.northEast.lat + boundary.southWest.lat) / 2;
    const mercatorCorrection = Math.cos(centerLat * (Math.PI / 180));
    return (lngSpan * mercatorCorrection) / latSpan;
  })();

  const updateBoundary = (next: typeof boundary) => {
    setBoundary(next);
    onBoundaryChange?.(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name,
        description,
        discoveryMode,
        imageBase64,
        mapImageBase64,
        boundary,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trail");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
      {/* Trail preview image */}
      <ImageUpload
        label="Trail Image"
        value={displayImage}
        onChange={setImageBase64}
        aspectRatio={16 / 9}
      />

      {/* Map background image — aspect ratio matches the trail boundary */}
      <ImageUpload
        label="Map Image"
        value={displayMapImage}
        onChange={setMapImageBase64}
        aspectRatio={mapImageAspectRatio}
      />

      <FormField label="Name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASS}
          placeholder="Enter trail name"
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={INPUT_CLASS}
          placeholder="Enter description"
          rows={3}
        />
      </FormField>

      <FormField label="Discovery Mode">
        <select
          value={discoveryMode}
          onChange={(e) => {
            const m = e.target.value as "free" | "sequence";
            setDiscoveryMode(m);
            onDiscoveryModeChange?.(m);
          }}
          className={INPUT_CLASS}
        >
          <option value="free">Free</option>
          <option value="sequence">Sequence</option>
        </select>
      </FormField>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Boundary</label>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="North Lat" small>
            <input
              type="number"
              step="any"
              value={boundary.northEast.lat}
              onChange={(e) =>
                updateBoundary({
                  ...boundary,
                  northEast: {
                    ...boundary.northEast,
                    lat: parseFloat(e.target.value),
                  },
                })}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="East Lon" small>
            <input
              type="number"
              step="any"
              value={boundary.northEast.lon}
              onChange={(e) =>
                updateBoundary({
                  ...boundary,
                  northEast: {
                    ...boundary.northEast,
                    lon: parseFloat(e.target.value),
                  },
                })}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="South Lat" small>
            <input
              type="number"
              step="any"
              value={boundary.southWest.lat}
              onChange={(e) =>
                updateBoundary({
                  ...boundary,
                  southWest: {
                    ...boundary.southWest,
                    lat: parseFloat(e.target.value),
                  },
                })}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="West Lon" small>
            <input
              type="number"
              step="any"
              value={boundary.southWest.lon}
              onChange={(e) =>
                updateBoundary({
                  ...boundary,
                  southWest: {
                    ...boundary.southWest,
                    lon: parseFloat(e.target.value),
                  },
                })}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>
      </div>

      <ErrorMessage error={error} />
      <FormActions loading={loading} onCancel={onCancel} />
    </form>
  );
}

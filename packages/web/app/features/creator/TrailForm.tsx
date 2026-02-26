import { useEffect, useState } from "react";
import { ImageUpload } from "../../components/ImageUpload.tsx";

interface TrailFormData {
  name: string;
  description: string;
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
    onSubmit,
    onCancel,
  }: TrailFormProps,
) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
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

  // Aspect ratio of map image should match the geographic boundary ratio
  const mapImageAspectRatio = (() => {
    const lngSpan = boundary.northEast.lon - boundary.southWest.lon;
    const latSpan = boundary.northEast.lat - boundary.southWest.lat;
    return latSpan > 0 && lngSpan > 0 ? lngSpan / latSpan : 1;
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

      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
          placeholder="Enter trail name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
          placeholder="Enter description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Boundary</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              North Lat
            </label>
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
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">East Lon</label>
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
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              South Lat
            </label>
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
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">West Lon</label>
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
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-primary text-onprimary rounded hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

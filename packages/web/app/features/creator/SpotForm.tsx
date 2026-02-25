import { useEffect, useState } from "react";
import { ImageUpload } from "../../components/ImageUpload.tsx";
import type { ContentBlock } from "./ContentBlockEditorList.tsx";
import { ContentBlockEditorList } from "./ContentBlockEditorList.tsx";

// --- Types ---

type SpotVisibility = "hidden" | "preview" | "private" | "public";

export interface SpotFormData {
  name: string;
  description: string;
  imageBase64?: string;
  contentBlocks: ContentBlock[];
  location: { lat: number; lon: number };
  visibility: SpotVisibility;
  trailIds: string[];
}

interface SpotFormProps {
  initialData?: Partial<SpotFormData>;
  /** Existing image URL (for edit mode, not base64) */
  existingImageUrl?: string;
  /** Available trails for assignment */
  trails?: { id: string; name: string }[];
  onSubmit: (data: SpotFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Spot creation/editing form.
 * Supports image upload, content blocks, trail assignment, and visibility.
 */
export function SpotForm(
  { initialData, existingImageUrl, trails = [], onSubmit, onCancel }:
    SpotFormProps,
) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [imageBase64, setImageBase64] = useState<string | undefined>(
    initialData?.imageBase64,
  );
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(
    initialData?.contentBlocks ?? [],
  );
  const [location, setLocation] = useState(
    initialData?.location ?? { lat: 0, lon: 0 },
  );
  const [visibility, setVisibility] = useState<SpotVisibility>(
    initialData?.visibility ?? "preview",
  );
  const [trailIds, setTrailIds] = useState<string[]>(
    initialData?.trailIds ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Show existing image as preview until a new one is picked
  const displayImage = imageBase64 ?? existingImageUrl;

  useEffect(() => {
    if (initialData?.location) {
      setLocation(initialData.location);
    }
  }, [initialData?.location?.lat, initialData?.location?.lon]);

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
        contentBlocks,
        location,
        visibility,
        trailIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save spot");
    } finally {
      setLoading(false);
    }
  };

  const toggleTrail = (trailId: string) => {
    setTrailIds((prev) =>
      prev.includes(trailId)
        ? prev.filter((id) => id !== trailId)
        : [...prev, trailId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image */}
      <ImageUpload
        label="Photo"
        value={displayImage}
        onChange={(base64) => setImageBase64(base64)}
        aspectRatio={3 / 4}
      />

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter spot name"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter description"
          rows={3}
        />
      </div>

      {/* Content Blocks */}
      <ContentBlockEditorList
        blocks={contentBlocks}
        onChange={setContentBlocks}
      />

      {/* Location */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={location.lat}
            onChange={(e) =>
              setLocation({ ...location, lat: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={location.lon}
            onChange={(e) =>
              setLocation({ ...location, lon: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium mb-1">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as SpotVisibility)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="hidden">Hidden</option>
          <option value="preview">Preview</option>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
      </div>

      {/* Trail Assignment */}
      {trails.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Trails</label>
          <div className="flex flex-wrap gap-2">
            {trails.map((trail) => (
              <button
                key={trail.id}
                type="button"
                onClick={() => toggleTrail(trail.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  trailIds.includes(trail.id)
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {trail.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

import clsx from "clsx";
import { useEffect, useState } from "react";

import { ImageUpload } from "../../components/ImageUpload.tsx";
import type { ContentBlock } from "./ContentBlockEditorList.tsx";
import { ContentBlockEditorList } from "./ContentBlockEditorList.tsx";
import {
  ErrorMessage,
  FormActions,
  FormField,
  INPUT_CLASS,
  SELECT_CLASS,
} from "./ui/index.ts";

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
  /** Called when location changes (for map sync) */
  onLocationChange?: (location: { lat: number; lon: number }) => void;
  onSubmit: (data: SpotFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Spot creation/editing form.
 * Supports image upload, content blocks, trail assignment, and visibility.
 */
export function SpotForm(
  {
    initialData,
    existingImageUrl,
    trails = [],
    onLocationChange,
    onSubmit,
    onCancel,
  }: SpotFormProps,
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

  // Sync location from external source (map click)
  useEffect(() => {
    if (initialData?.location) {
      setLocation(initialData.location);
    }
  }, [initialData?.location?.lat, initialData?.location?.lon]);

  // Update location and notify parent for map sync
  const updateLocation = (newLocation: { lat: number; lon: number }) => {
    if (isNaN(newLocation.lat) || isNaN(newLocation.lon)) return;
    setLocation(newLocation);
    onLocationChange?.(newLocation);
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
      <FormField label="Name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASS}
          placeholder="Enter spot name"
        />
      </FormField>

      {/* Description */}
      <FormField label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={INPUT_CLASS}
          placeholder="Enter description"
          rows={3}
        />
      </FormField>

      {/* Content Blocks */}
      <ContentBlockEditorList
        blocks={contentBlocks}
        onChange={setContentBlocks}
      />

      {/* Location */}
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Latitude">
          <input
            type="number"
            step="any"
            value={location.lat}
            onChange={(e) =>
              updateLocation({ ...location, lat: parseFloat(e.target.value) })}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Longitude">
          <input
            type="number"
            step="any"
            value={location.lon}
            onChange={(e) =>
              updateLocation({ ...location, lon: parseFloat(e.target.value) })}
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

      {/* Visibility */}
      <FormField label="Visibility">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as SpotVisibility)}
          className={SELECT_CLASS}
        >
          <option value="hidden">Hidden</option>
          <option value="preview">Preview</option>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
      </FormField>

      {/* Trail Assignment */}
      {trails.length > 0 && (
        <FormField label="Trails">
          <div className="flex flex-wrap gap-2">
            {trails.map((trail) => (
              <button
                key={trail.id}
                type="button"
                onClick={() => toggleTrail(trail.id)}
                className={clsx(
                  "px-3 py-1 text-xs rounded-full border transition-colors",
                  trailIds.includes(trail.id)
                    ? "bg-primary border-gray-500 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-300 hover:bg-gray-100",
                )}
              >
                {trail.name}
              </button>
            ))}
          </div>
        </FormField>
      )}

      <ErrorMessage error={error} />
      <FormActions loading={loading} onCancel={onCancel} />
    </form>
  );
}

import { useCallback, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import Cropper from "react-easy-crop";

interface ImageUploadProps {
  /** Current image as base64 data URL or external URL */
  value?: string;
  /** Called with base64 data URL or undefined when removed */
  onChange: (base64: string | undefined) => void;
  label?: string;
  /** Aspect ratio for cropping (e.g. 3/4). If set, enables crop mode after file selection. */
  aspectRatio?: number;
  className?: string;
}

// --- Crop helper: extract cropped area from image via canvas ---

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.src = url;
  });
}

/**
 * Reusable image upload component with drag & drop, file picker, crop modal, and preview.
 * When aspectRatio is set, selecting a file opens a crop overlay before committing.
 * Converts selected files to base64 data URLs for API submission.
 */
export function ImageUpload(
  { value, onChange, label, aspectRatio, className = "" }: ImageUploadProps,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const openFile = useCallback((file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (aspectRatio) {
        // Open crop modal
        setCropSrc(dataUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      } else {
        onChange(dataUrl);
      }
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsDataURL(file);
  }, [onChange, aspectRatio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) openFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const applyCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImage(cropSrc, croppedAreaPixels);
      onChange(cropped);
    } catch {
      setError("Failed to crop image");
    } finally {
      setCropSrc(null);
    }
  };

  const cancelCrop = () => setCropSrc(null);

  // --- Crop overlay ---
  if (cropSrc) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium mb-1">{label}</label>
        )}
        <div
          className="relative w-full rounded border border-gray-200 overflow-hidden"
          style={{ height: 320 }}
        >
          <Cropper
            image={cropSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio ?? 1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={applyCrop}
            className="flex-1 px-3 py-1.5 bg-primary rounded text-sm hover:bg-gray-700"
          >
            Apply Crop
          </button>
          <button
            type="button"
            onClick={cancelCrop}
            className="flex-1 px-3 py-1.5 bg-gray-200 rounded text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  // --- Preview with image ---
  if (value) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium mb-1">{label}</label>
        )}
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="w-full rounded border border-gray-300 object-cover"
            style={aspectRatio
              ? { aspectRatio: String(aspectRatio) }
              : { maxHeight: 200 }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="px-3 py-1.5 bg-red-600 rounded text-sm hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  // --- Empty state with drop zone ---
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded cursor-pointer transition-colors flex flex-col items-center justify-center py-8 px-4 ${
          dragging
            ? "border-gray-400 bg-gray-900/20"
            : "border-gray-300 hover:border-gray-500 bg-white/50"
        }`}
      >
        <svg
          className="w-8 h-8 text-gray-500 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm text-gray-400">Click or drag image here</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

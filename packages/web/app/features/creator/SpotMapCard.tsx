import { MapPinIcon } from "@heroicons/react/24/solid";
import type { Spot } from "./mapEditorStore.ts";

const CARD_WIDTH = 64;
const CARD_HEIGHT = 86;
const IMAGE_ASPECT_RATIO = 4 / 3;

interface SpotMapCardProps {
  spot: Spot;
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Small spot card for map overlay.
 * Shows image (if available) with gradient frame and title, similar to the app's SpotCard.
 */
export function SpotMapCard(props: SpotMapCardProps) {
  const { spot, isSelected, onClick } = props;

  const imageHeight = (CARD_WIDTH - 6) / IMAGE_ASPECT_RATIO;

  return (
    <div
      className="flex flex-col items-center"
      style={{
        transform: `translate(-${CARD_WIDTH / 2}px, -${CARD_HEIGHT}px)`,
      }}
    >
      {/* Long-press hint shown when selected */}
      {isSelected && (
        <div
          className="mb-1 px-1.5 py-0.5 rounded text-white text-center whitespace-nowrap"
          style={{
            fontSize: 9,
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
          }}
        >
          Hold to move
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-stretch cursor-pointer transition-transform hover:scale-105"
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: "#000",
          boxShadow: isSelected
            ? "0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.4)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* Title */}
        <div
          className="text-white w-full font-semibold text-center truncate px-1 absolute"
          style={{ fontSize: 8, lineHeight: "14px", minHeight: 14 }}
        >
          {spot.name}
        </div>

        {/* Image area */}
        <div
          className="flex-1 rounded-lg overflow-hidden"
          style={{
            backgroundColor: "rgba(0,0,0,0.15)",
            minHeight: imageHeight,
          }}
        >
          {spot.image?.url
            ? (
              <img
                src={spot.image.url}
                alt={spot.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            )
            : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPinIcon className="text-white size-6" />
              </div>
            )}
        </div>

        {/* Bottom pointer triangle */}
        <div
          className="mx-auto absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: isSelected ? "5px solid #fff" : "5px solid #999",
            marginTop: -1,
          }}
        />
      </button>
    </div>
  );
}

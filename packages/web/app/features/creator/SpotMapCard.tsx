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
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-stretch cursor-pointer transition-transform hover:scale-105"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 10,
        overflow: "hidden",
        background: isSelected
          ? "linear-gradient(135deg, #facc15, #f59e0b)"
          : "linear-gradient(135deg, #a341ff, #4149b9)",
        padding: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        transform: `translate(-${CARD_WIDTH / 2}px, -${CARD_HEIGHT}px)`,
      }}
    >
      {/* Title */}
      <div
        className="text-white font-semibold text-center truncate px-1"
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
              <span style={{ fontSize: 16, opacity: 0.4 }}>📍</span>
            </div>
          )}
      </div>

      {/* Bottom pointer triangle */}
      <div
        className="mx-auto"
        style={{
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: isSelected ? "5px solid #f59e0b" : "5px solid #4149b9",
          marginTop: -1,
        }}
      />
    </button>
  );
}

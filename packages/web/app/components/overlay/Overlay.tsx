import React, { useEffect, useState } from "react";
import { useOverlayStore } from "./useOverlayStore";

// Animation constants
const FADE_IN_DURATION = 300;
const FADE_OUT_DURATION = 200;
const INITIAL_SCALE = 0.95;
const FINAL_SCALE = 1;
const OVERLAY_Z_INDEX = 1000;

/**
 * Hook to manage overlay animation logic
 */
const useOverlayAnimation = (visible: boolean) => {
  const [shouldRender, setShouldRender] = useState(visible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Start animation on next frame
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, FADE_OUT_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return { shouldRender, isAnimating };
};

/**
 * Provider component that renders all active overlays from the store
 */
function OverlayProvider() {
  const overlayStore = useOverlayStore();

  if (overlayStore.overlays?.length > 0) {
    return (
      <>
        {overlayStore.overlays.map((overlayItem) => {
          const settings = overlayItem.settings || {};
          const removeOverlay = () => overlayStore.remove(overlayItem.id);

          return (
            <Overlay
              key={overlayItem.id}
              visible
              onClose={removeOverlay}
              showBackdrop={settings.showBackdrop}
              closeOnBackdropPress={settings.closeOnBackdropPress}
            >
              {overlayItem.overlay}
            </Overlay>
          );
        })}
      </>
    );
  }
  return null;
}

interface OverlayProps {
  visible?: boolean;
  onClose?: () => void;
  showBackdrop?: boolean;
  closeOnBackdropPress?: boolean;
  children?: React.ReactNode;
}

/**
 * Overlay - Backdrop and animation shell for overlay content.
 * Content determines its own size and presentation.
 */
function Overlay(props: OverlayProps) {
  const {
    visible,
    onClose,
    showBackdrop = true,
    closeOnBackdropPress = false,
    children,
  } = props;
  const { shouldRender, isAnimating } = useOverlayAnimation(visible ?? true);

  if (!shouldRender) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: OVERLAY_Z_INDEX,
    opacity: isAnimating ? 1 : 0,
    transition: `opacity ${
      isAnimating ? FADE_IN_DURATION : FADE_OUT_DURATION
    }ms ease-out, transform ${
      isAnimating ? FADE_IN_DURATION : FADE_OUT_DURATION
    }ms ease-out`,
  };

  const backdropStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    cursor: closeOnBackdropPress ? "pointer" : "default",
  };

  const contentAreaStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={containerStyle}>
      {showBackdrop && (
        <div
          style={backdropStyle}
          onClick={closeOnBackdropPress ? onClose : undefined}
        />
      )}
      <div style={contentAreaStyle}>
        {children}
      </div>
    </div>
  );
}

export { OverlayProvider };
export default Overlay;

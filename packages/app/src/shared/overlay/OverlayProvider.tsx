import OverlayContainer from "./Overlay"
import { useOverlayStore } from "./useOverlayStore"

/**
 * Provider component that renders all active overlays from the store
 */
function OverlayProvider() {
  const overlayStore = useOverlayStore()

  if (overlayStore.overlays?.length > 0) {
    return overlayStore.overlays.map((overlayItem) => (
      <OverlayContainer
        key={overlayItem.id}
        visible
        transparent={overlayItem.settings?.transparent}
        closeOnBackdropPress={overlayItem.settings?.closeOnBackdropPress}
      >
        {overlayItem.overlay}
      </OverlayContainer>
    ))
  }
  return null
}
export default OverlayProvider

import { View } from "react-native"
import { useBackHandler } from "../navigation/useBackHandler"
import { useOverlayStore } from "./useOverlayStore"

/**
 * Provider component that renders all active overlays from the store
 */
function OverlayProvider() {
  const overlayStore = useOverlayStore()

  // Handle Android back button - close overlay if any are open
  useBackHandler(() => {
    if (overlayStore.overlays?.length > 0) {
      overlayStore.pop()
      return true // Prevent default behavior (app exit)
    }
    return false // Allow default behavior
  }, overlayStore.overlays?.length > 0)

  if (overlayStore.overlays?.length > 0) {
    return overlayStore.overlays.map((overlayItem) => (
      <View key={overlayItem.id}>{overlayItem.overlay}</View>
    ))
  }
  return null
}
export default OverlayProvider

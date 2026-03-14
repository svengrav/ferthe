import * as Haptics from 'expo-haptics'
import { useEffect } from "react"
import { useDiscoveryEventCardOverlay } from "../components/DiscoveryEventCard"
import { useDiscoveryEvent } from "../stores/discoveryStore"

export const useDiscoveryEventCard = () => {
  const discoveryEvent = useDiscoveryEvent()
  const { showDiscoveryEventCard } = useDiscoveryEventCardOverlay()
  useEffect(() => {
    if (discoveryEvent) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      showDiscoveryEventCard(discoveryEvent.spotId, { mode: 'reveal' })
    }
  }, [discoveryEvent, showDiscoveryEventCard])
}

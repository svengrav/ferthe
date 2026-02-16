import { useEffect } from "react"
import { useDiscoveryEventCardOverlay } from "../components/DiscoveryEventCard"
import { useDiscoveryEvent } from "../stores/discoveryStore"

export const useDiscoveryEventCard = () => {
  const discoveryEvent = useDiscoveryEvent()
  const { showDiscoveryEventCard } = useDiscoveryEventCardOverlay()
  useEffect(() => {
    if (discoveryEvent) {
      showDiscoveryEventCard(discoveryEvent, { mode: 'reveal' })
    }
  }, [discoveryEvent, showDiscoveryEventCard])
}

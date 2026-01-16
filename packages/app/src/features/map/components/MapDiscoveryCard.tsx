import { getAppContext } from '@app/appContext'
import DiscoveryCardHighlight from '@app/features/discovery/components/DiscoveryCardHighlight'
import { DiscoveryCardState } from '@app/features/discovery/logic/types'
import { useEvent } from '@app/shared/events/useEvent'
import { useState } from 'react'

/**
 * Custom hook to handle new discovery events and state management.
 * Returns the current discovery, visibility state, and close handler.
 */
const useNewDiscoveryHandler = () => {
  const { discoveryApplication } = getAppContext()
  const [currentDiscovery, setCurrentDiscovery] = useState<DiscoveryCardState | undefined>(undefined)
  const [isVisible, setIsVisible] = useState(false)

  // Listen for new discoveries and show the first one
  useEvent(discoveryApplication.onNewDiscoveries, (discoveries: DiscoveryCardState[]) => {
    if (discoveries.length > 0) {
      setCurrentDiscovery(discoveries[0])
      setIsVisible(true)
    }
  })

  const handleCloseDiscovery = () => {
    setIsVisible(false)
    setCurrentDiscovery(undefined)
  }

  return {
    currentDiscovery,
    isVisible,
    handleCloseDiscovery,
  }
}

/**
 * Component that displays discovery cards on the map when new discoveries are made.
 * Shows a highlight card overlay when a discovery is triggered.
 */
function MapDiscoveryCard() {
  const { currentDiscovery, isVisible, handleCloseDiscovery } = useNewDiscoveryHandler()

  // Only render if there's a visible discovery
  if (!isVisible || !currentDiscovery) {
    return null
  }

  return (
    <DiscoveryCardHighlight
      visible={isVisible}
      card={currentDiscovery}
      onClose={handleCloseDiscovery}
    />
  )
}

export default MapDiscoveryCard
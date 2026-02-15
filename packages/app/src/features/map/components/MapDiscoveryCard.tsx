import { getAppContext } from '@app/appContext'
import DiscoveryCardHighlight from '@app/features/discovery/components/DiscoveryCardHighlight'
import { DiscoveryCardState } from '@app/features/discovery/logic/types'
import { useEvent } from '@app/shared/events/useEvent'
import { useState } from 'react'
import { useMapSpotTap, useSetTappedSpot } from '../stores/mapStore'

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
 * Custom hook to handle spot tap events and convert to card format.
 */
const useSpotTapHandler = () => {
  const tappedSpot = useMapSpotTap()
  const setTappedSpot = useSetTappedSpot()
  const [currentSpot, setCurrentSpot] = useState<DiscoveryCardState | undefined>(undefined)
  const [isVisible, setIsVisible] = useState(false)

  // Convert tapped spot to card format
  if (tappedSpot && !isVisible) {
    const spotCard: DiscoveryCardState = {
      discoveryId: tappedSpot.discoveryId,
      spotId: tappedSpot.id,
      title: tappedSpot.name,
      description: tappedSpot.description,
      image: tappedSpot.image || { id: '', url: '' },
      blurredImage: tappedSpot.blurredImage,
      discoveredAt: tappedSpot.createdAt,
    }
    setCurrentSpot(spotCard)
    setIsVisible(true)
  }

  const handleCloseSpot = () => {
    setIsVisible(false)
    setCurrentSpot(undefined)
    setTappedSpot(undefined)
  }

  return {
    currentSpot,
    isVisible,
    handleCloseSpot,
  }
}

/**
 * Component that displays discovery cards and spot cards on the map.
 * Shows a highlight card overlay with options to view details or close.
 */
function MapDiscoveryCard() {
  const { currentDiscovery, isVisible: discoveryVisible, handleCloseDiscovery } = useNewDiscoveryHandler()
  const { currentSpot, isVisible: spotVisible, handleCloseSpot } = useSpotTapHandler()


  // Show discovery card if available (with tap-to-reveal)
  if (discoveryVisible && currentDiscovery) {
    return (
      <DiscoveryCardHighlight
        visible={discoveryVisible}
        card={currentDiscovery}
        mode="reveal"
        onClose={handleCloseDiscovery}
      />
    )
  }

  // Show spot card if available (instant reveal for known spots)
  if (spotVisible && currentSpot) {
    return (
      <DiscoveryCardHighlight
        visible={spotVisible}
        card={currentSpot}
        mode="instant"
        onClose={handleCloseSpot}
      />
    )
  }

  return null
}

export default MapDiscoveryCard
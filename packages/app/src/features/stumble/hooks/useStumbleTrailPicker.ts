import { Trail } from '@shared/contracts'
import { closeOverlay, OverlayCard, setOverlay } from '@app/shared/overlay'
import { sensorStore } from '@app/features/sensor/stores/sensorStore'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { StumblePreferencePicker } from '../components/StumblePreferencePicker'
import { createElement } from 'react'

/**
 * Encapsulates the stumble trail selection flow:
 * opens the preference picker overlay and activates stumble mode on confirm.
 */
export const useStumbleTrailPicker = () => {
  const { stumbleApplication } = getAppContextStore()

  const openForTrail = (trail: Trail, onActivated: () => void) => {
    const pickerId = 'stumble-preferences'
    setOverlay(
      pickerId,
      createElement(OverlayCard, {
        title: 'Stumble Preferences',
        onClose: () => closeOverlay(pickerId),
        children: createElement(StumblePreferencePicker, {
          onStart: () => {
            const { location } = sensorStore.getState().device
            closeOverlay(pickerId)
            onActivated()
            stumbleApplication.toggleMode(location.lat, location.lon)
          },
          onClose: () => closeOverlay(pickerId),
        })
      })
    )
  }

  return { openForTrail }
}

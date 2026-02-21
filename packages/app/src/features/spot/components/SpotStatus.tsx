import { Chip } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { Discovery, Spot } from '@shared/contracts'

interface SpotStatusProps {
  spot: Spot
  discovery?: Discovery
}

/**
 * Displays the user-specific status of a spot:
 * - Discovered: Shows when the spot was discovered
 * - Creator: Shows when the spot was created (user is creator)
 * - Preview/Unknown: Shows "Preview" status
 */
function SpotStatus(props: SpotStatusProps) {
  const { spot, discovery } = props
  const { locales } = useLocalization()

  const getStatusText = () => {
    switch (spot.source) {
      case 'discovery':
        if (discovery?.discoveredAt) {
          const date = new Date(discovery.discoveredAt).toLocaleDateString()
          return `${locales.discovery.discovered} ${date}`
        }
        return locales.discovery.discovered

      case 'created':
        const createdDate = new Date(spot.createdAt).toLocaleDateString()
        return `${locales.common.created} ${createdDate}`

      case 'preview':
      default:
        return locales.trails.preview || 'Preview'
    }
  }

  return <Chip label={getStatusText()} />
}

export default SpotStatus

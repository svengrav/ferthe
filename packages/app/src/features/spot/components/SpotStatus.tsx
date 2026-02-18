import { Text } from '@app/shared/components'
import { useApp } from '@app/shared/useApp'
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
  const { locales } = useApp()

  const getStatusText = () => {
    switch (spot.userStatus) {
      case 'discovered':
        if (discovery?.discoveredAt) {
          const date = new Date(discovery.discoveredAt).toLocaleDateString()
          return `${locales.discovery.discovered} ${date}`
        }
        return locales.discovery.discovered

      case 'creator':
        const createdDate = new Date(spot.createdAt).toLocaleDateString()
        return `${locales.common.created} ${createdDate}`

      case 'preview':
        return locales.trails.preview || 'Preview'

      case 'unknown':
      default:
        return locales.trails.preview || 'Preview'
    }
  }

  return <Text variant="body">{getStatusText()}</Text>
}

export default SpotStatus

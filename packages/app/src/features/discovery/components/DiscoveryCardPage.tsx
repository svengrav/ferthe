import { Button, Page, PageTab, PageTabs } from '@app/shared/components'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { useApp } from '@app/shared/useApp'

import { DiscoveryCardState } from '../logic/types'
import DiscoveryCardContent from './DiscoveryCardContent'
import DiscoveryStats from './DiscoveryStats'

export const useDiscoveryCardPage = () => ({
  showDiscoveryCardDetails: (card: DiscoveryCardState) => {
    const overlayId = 'discoveryCardDetails-' + card.discoveryId
    setOverlay(
      overlayId,
      <DiscoveryCardPage card={card} onClose={() => closeOverlay(overlayId)} />,

    )
  },
  closeDiscoveryCardDetails: (discoveryId: string) => closeOverlay('discoveryCardDetails-' + discoveryId),
})

interface DiscoveryCardPageProps {
  onClose?: () => void
  card: DiscoveryCardState
}

/**
 * Discovery card page that displays a discovered spot with image, title, and description.
 * Features smooth animations and scroll-based parallax effects.
 */
function DiscoveryCardPage(props: DiscoveryCardPageProps) {
  const { card, onClose } = props
  const { locales } = useApp()

  return (
    <Page
      title={locales.discovery.discoveries}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onClose} />}
    >
      <PageTabs variant="chips" defaultTab="overview">
        <PageTab id="overview" label={locales.trails.overview}>
          <DiscoveryCardContent card={card} />

        </PageTab>
        <PageTab id="stats" label={locales.trails.stats.name}>
          <DiscoveryStats discoveryId={card.discoveryId} />
        </PageTab>
      </PageTabs>
    </Page>
  )
}

export default DiscoveryCardPage

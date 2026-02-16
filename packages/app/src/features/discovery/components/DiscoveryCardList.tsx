import { SpotCardList } from '@app/features/spot/components'
import { DiscoveryCardState } from '../logic/types'

export function DiscoveryCardList({
  onTap,
  cards,
  refreshing,
  onRefresh,
}: {
  onTap?: (card: DiscoveryCardState) => void
  cards: DiscoveryCardState[]
  refreshing?: boolean
  onRefresh?: () => void
}) {
  // Map DiscoveryCardState to SpotCardListItem
  const items = cards.map(card => ({
    id: card.spotId,
    image: card.image,
    title: card.title,
    discovered: true,
  }))

  return (
    <SpotCardList
      items={items}
      onPress={(item) => {
        const card = cards.find(c => c.spotId === item.id)
        if (card && onTap) onTap(card)
      }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  )
}


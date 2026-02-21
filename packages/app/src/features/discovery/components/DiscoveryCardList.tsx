import { SpotCardList } from '@app/features/spot/components'
import { DiscoveryEventState } from '../services/types'

interface DiscoveryCardListProps {
  onPress?: (card: DiscoveryEventState) => void
  cards: DiscoveryEventState[]
  refreshing?: boolean
  onRefresh?: () => void
}

export function DiscoveryCardList({
  onPress,
  cards,
  refreshing,
  onRefresh,
}: DiscoveryCardListProps) {
  // Map DiscoveryEventState to SpotCardListItem
  const items = cards.map(card => ({
    id: card.spotId,
    image: card.image,
    title: card.title,
    isLocked: false,
  }))

  return (
    <SpotCardList
      items={items}
      onPress={(item) => {
        const card = cards.find(c => c.spotId === item.id)
        if (card && onPress) onPress(card)
      }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  )
}


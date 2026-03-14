import { Button, Divider } from '@app/shared/components'
import { Trail } from '@shared/contracts'
import { ActivityIndicator, FlatList } from 'react-native'
import TrailItem from './TrailItem'

interface TrailListProps {
  trails: Trail[]
  isRefreshing?: boolean
  onRefresh?: () => void
  onEndReached?: () => void
  loadingMore?: boolean
  onPress: (trail: Trail) => void
}

/**
 * Displays a list of trails. Supports pull-to-refresh and infinite scroll.
 */
function TrailList(props: TrailListProps) {
  const { trails, isRefreshing, onRefresh, onEndReached, loadingMore, onPress } = props

  return (
    <FlatList
      data={trails}
      ItemSeparatorComponent={() => <Divider size="none" />}
      renderItem={({ item }) => (
        <TrailItem
          trail={item}
          onPress={onPress}
          trailing={
            <Button icon="chevron-right" variant="secondary" onPress={() => onPress(item)} />
          }
        />
      )}
      keyExtractor={item => item.id}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} /> : undefined}
    />
  )
}

export default TrailList

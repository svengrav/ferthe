import { FlatList, StyleSheet, View } from 'react-native'

interface DiscoveryCard {
  title: string
  createdAt?: string
  imageUrl?: string
}

interface DiscoveryHorizontalListProps {
  discoveries: DiscoveryCard[]
  renderItem: ({ item, index }: { item: DiscoveryCard; index: number }) => React.ReactElement
  keyExtractor?: (item: DiscoveryCard, index: number) => string
  style?: any
}

export function DiscoveryHorizontalList({
  discoveries,
  renderItem,
  keyExtractor = (_, i) => i.toString(),
  style,
}: DiscoveryHorizontalListProps) {
  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={discoveries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
        bounces={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: 8,
  },
})

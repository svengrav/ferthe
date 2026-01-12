import { FlatList, StyleSheet, View } from 'react-native'
import SpotCard from './SpotCard'



interface SpotListProps {
  cards: {
    image: {
      url: string
    }
  }[]
  style?: any
}

export function SpotCardList({
  cards,
  style,
}: SpotListProps) {
  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={cards}
        renderItem={({ item }) => <SpotCard card={item} />}
        keyExtractor={(_, i) => i.toString()}
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

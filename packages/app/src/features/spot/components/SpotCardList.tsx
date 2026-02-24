import { ReactElement, useState } from 'react'
import { FlatList, LayoutChangeEvent, StyleSheet, View } from 'react-native'
import SpotCard from '../card/components/SpotCard'
import { useSpotCardDimensions } from '../card/hooks/useSpotCardDimensions'
import { useSpotPage } from './SpotPage'

/**
 * Generic grid list for spot cards.
 * Provides responsive 2-column layout with gap and refresh support.
 * 
 * @example
 * // Basic usage with default SpotCard rendering
 * <SpotCardList
 *   items={spots}
 *   onPress={(spot) => navigate('SpotDetail', { id: spot.id })}
 *   refreshing={loading}
 *   onRefresh={reload}
 * />
 * 
 * @example
 * // Custom rendering
 * <SpotCardList
 *   items={discoveries}
 *   renderItem={(item, width, height) => (
 *     <CustomSpotCard {...item} width={width} height={height} />
 *   )}
 * />
 */



// Layout constants
const DEFAULT_GAP = 12
const DEFAULT_COLUMNS = 2

// Splits an array into chunks of the given size
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

interface SpotCardListItem {
  id: string
  image?: any
  blurredImage?: any
  title?: string
  isLocked: boolean
}

interface SpotCardListProps<T extends SpotCardListItem> {
  items: T[]
  onPress?: (item: T) => void
  onRefresh?: () => void
  refreshing?: boolean
  columns?: number
  gap?: number
  padding?: number
  scrollEnabled?: boolean
  horizontal?: boolean
  style?: object
  renderItem?: (item: T, width: number, height: number) => ReactElement
}

function SpotCardList<T extends SpotCardListItem>({
  items,
  onPress,
  onRefresh,
  refreshing,
  columns = DEFAULT_COLUMNS,
  gap = DEFAULT_GAP,
  scrollEnabled = true,
  horizontal = false,
  style,
  renderItem,
}: SpotCardListProps<T>) {
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 })
  const { cardRatio, width: fixedWidth, height: fixedHeight } = useSpotCardDimensions(
    horizontal ? { variant: 'grid', customWidth: 160 } : { variant: 'card' }
  )
  const { showSpotPage } = useSpotPage()

  const handleLayout = (e: LayoutChangeEvent) => {
    if (horizontal) return
    const width = e.nativeEvent.layout.width
    const availableWidth = width - gap * (columns - 1)
    const cardWidth = availableWidth / columns
    const cardHeight = cardWidth * cardRatio
    setCardSize({ width: cardWidth, height: cardHeight })
  }

  const resolvedWidth = horizontal ? fixedWidth : cardSize.width
  const resolvedHeight = horizontal ? fixedHeight : cardSize.height

  const defaultRenderItem = (item: T) => (
    <SpotCard
      key={item.id}
      width={resolvedWidth}
      height={resolvedHeight}
      image={item.image}
      blurredImage={item.blurredImage}
      isLocked={item.isLocked}
      title={item.title}
      onPress={() => {
        if (onPress) {
          onPress(item)
        } else {
          showSpotPage(item.id)
        }
      }}
    />
  )

  if (horizontal) {
    return (
      <FlatList
        data={items}
        renderItem={({ item }) =>
          renderItem ? renderItem(item, resolvedWidth, resolvedHeight) : defaultRenderItem(item)
        }
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: gap }} />}
        style={style}
      />
    )
  }

  return (
    <View onLayout={handleLayout} style={[styles.container, style]}>
      {cardSize.width > 0 && (scrollEnabled ? (
        <FlatList
          data={items}
          renderItem={({ item }) =>
            renderItem ? renderItem(item, resolvedWidth, resolvedHeight) : defaultRenderItem(item)
          }
          keyExtractor={(item) => item.id}
          numColumns={columns}
          refreshing={refreshing}
          onRefresh={onRefresh}
          columnWrapperStyle={columns > 1 ? { gap } : undefined}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ height: gap }} />}
        />
      ) : (
        // Avoid nested ScrollView: render plain grid when scroll is disabled (e.g. inside Page scrollable)
        chunk(items, columns).map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.row, { gap, marginTop: rowIndex > 0 ? gap : 0 }]}>
            {row.map(item => renderItem ? renderItem(item, resolvedWidth, resolvedHeight) : defaultRenderItem(item))}
          </View>
        ))
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
  },
})

export default SpotCardList

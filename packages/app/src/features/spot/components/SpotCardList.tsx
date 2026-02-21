import { useSpotCardDimensions } from '@app/features/spot/components'
import { ReactElement, useEffect, useRef, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import SpotCard from '../card/components/SpotCard'
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
  const containerRef = useRef<View>(null)
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 })
  const { cardRatio, width: fixedWidth, height: fixedHeight } = useSpotCardDimensions(
    horizontal ? { variant: 'grid', customWidth: 160 } : { variant: 'card' }
  )
  const { showSpotPage } = useSpotPage()

  // Measure container and calculate card dimensions (grid mode only)
  useEffect(() => {
    if (horizontal) return
    containerRef.current?.measure((x, y, width) => {
      const availableWidth = width - gap * (columns - 1)
      const cardWidth = availableWidth / columns
      const cardHeight = cardWidth * cardRatio
      setCardSize({ width: cardWidth, height: cardHeight })
    })
  }, [containerRef.current, columns, gap, cardRatio, horizontal])

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
        contentContainerStyle={{ paddingHorizontal: gap }}
        style={style}
      />
    )
  }

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      <FlatList
        data={items}
        renderItem={({ item }) =>
          renderItem ? renderItem(item, resolvedWidth, resolvedHeight) : defaultRenderItem(item)
        }
        keyExtractor={(item) => item.id}
        numColumns={columns}
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollEnabled={scrollEnabled}
        columnWrapperStyle={columns > 1 ? { gap } : undefined}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: gap }} />}
      />
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
})

export default SpotCardList

import { Image, Text } from '@app/shared/components'
import { Theme, useThemeStore } from '@app/shared/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { DiscoveryCardState } from '../logic/types'

// Layout constants for consistent spacing
const GAP = 12
const PADDING = 8
const CARD_ASPECT_RATIO = 1.5

function useDiscoveryCardList() {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const containerRef = useRef<View>(null)
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 })
  const numberOfColumns = 2

  useEffect(() => {
    containerRef.current?.measure((x, y, width) => {
      // Calculate card width: (containerWidth - padding*2 - gap) / columns
      const availableWidth = width - PADDING * 2 - GAP
      const cardWidth = availableWidth / numberOfColumns
      const cardHeight = cardWidth * CARD_ASPECT_RATIO
      setCardSize({ width: cardWidth, height: cardHeight })
    })
  }, [containerRef.current])

  return {
    cardSize,
    numberOfColumns,
    styles,
    containerRef,
  }
}

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
  const { numberOfColumns, cardSize, styles, containerRef } = useDiscoveryCardList()
  const flatListRef = useRef<FlatList>(null)

  return (
    <View ref={containerRef} style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={cards}
        renderItem={(list) => (
          <DiscoveryImageCard
            width={cardSize.width}
            height={cardSize.height}
            card={list.item}
            onTap={onTap}
          />
        )}
        keyExtractor={(_, index) => index.toString()}
        numColumns={numberOfColumns}
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollEnabled={true}
        columnWrapperStyle={styles.rowStyle}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      />
    </View>
  )
}

function DiscoveryImageCard({ width, height, card, onTap }: { width: number; height: number; card: DiscoveryCardState; onTap?: (card: DiscoveryCardState) => void }) {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  return (<>

    <Pressable onPress={() => onTap && onTap(card) }>
      <View style={[styles.placeholder, { width, height }]}>
        <Text style={styles.label}>{card.title}</Text>
        <LinearGradient
          style={{
            zIndex: 1,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 50,
          }}
          colors={['transparent', 'rgba(0, 0, 0, 0.322)']}
        />
        <Image
          source={{ uri: card.image.url }}
          style={{
            width: width,
            height: height,
            borderRadius: 10,
            backgroundColor: '#000'
          }}
          resizeMode="cover"
        />
      </View>
    </Pressable>
  </>
  )
}

const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // FlatList container with consistent padding
    listContainer: {
      padding: PADDING,
    },
    // Row wrapper for horizontal gap between cards
    rowStyle: {
      gap: GAP,
    },
    // Card placeholder with rounded corners
    placeholder: {
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
    },
    // Card title overlay at bottom
    label: {
      fontSize: 18,
      fontWeight: 'semibold',
      color: 'white',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      zIndex: 2,
      width: '100%',
      position: 'absolute',
      bottom: 5,
    },
    // Detail view styles
    top: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: theme.colors.divider,
      borderBottomWidth: 1,
      paddingBottom: 8,
    },
    slug: {
      color: theme.deriveColor(theme.colors.onBackground),
    },
    date: {
      color: theme.deriveColor(theme.colors.onBackground),
    },
    title: {
      color: theme.colors.onBackground,
      paddingVertical: 12,
    },
    content: {
      color: theme.colors.onSurface,
    },
    bottom: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      alignItems: 'center',
      paddingTop: 8,
    },
  })
}

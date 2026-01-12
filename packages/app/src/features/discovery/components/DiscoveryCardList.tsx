import { Image, Text } from '@app/shared/components'
import { setOverlay } from '@app/shared/overlay/useOverlayStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { DiscoveryCardState } from '../logic/types'
import DiscoveryCardDetails from './DiscoveryCardDetails'

function useDiscoveryCardList() {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const containerRef = useRef<View>(null)
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 })
  const numberOfColumns = 2

  useEffect(() => {
    containerRef.current?.measure((x, y, width) => {
      const cardWidth = width / numberOfColumns - 10
      const cardHeight = (width / numberOfColumns - 10) * 1.5
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

export function DiscoveryImageCardList({
  cards,
  refreshing,
  onRefresh,
}: {
  cards: DiscoveryCardState[]
  refreshing?: boolean
  onRefresh?: () => void
}) {
  const { numberOfColumns, cardSize, styles, containerRef } = useDiscoveryCardList()

  return (
    <View ref={containerRef} style={{ flex: 1 }}>
      <FlatList
        data={cards}
        renderItem={(list) => (
          <DiscoveryImageCard
            width={cardSize.width}
            height={cardSize.height}
            card={list.item}
          />
        )}
        keyExtractor={(_, index) => index.toString()}
        numColumns={numberOfColumns}
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollEnabled={true}
        columnWrapperStyle={styles.rowStyle}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  )
}

function DiscoveryImageCard({ width, height, card }: { width: number; height: number; card: DiscoveryCardState }) {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  return (<>

    <Pressable onPress={() => {
      const close = setOverlay(<DiscoveryCardDetails card={card} onClose={() => close()} />)
    }}>
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
            borderRadius: 2,
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
    listContainer: {},
    rowStyle: {
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    cardContainer: {},
    placeholder: {
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
    },
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
      ...theme.text.size.xs,
    },
    date: {
      color: theme.deriveColor(theme.colors.onBackground),
      ...theme.text.size.xs,
    },
    title: {
      ...theme.text.size.lg,
      fontFamily: theme.text.primary.bold,
      color: theme.colors.onBackground,
      paddingVertical: 12,
    },
    content: {
      ...theme.text.size.md,
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

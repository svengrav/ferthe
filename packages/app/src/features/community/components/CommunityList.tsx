import { Button, Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { Community } from '@shared/contracts/communities'
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native'
import CommunityCard from './CommunityCard'
import { useCommunityCreatorCard } from './CommunityCreatorCard.tsx'

interface CommunityListProps {
  communities: Community[]
  isLoading: boolean
  onRefresh: () => void
  onEndReached?: () => void
  loadingMore?: boolean
  onJoinPress: () => void
}

export function CommunityList({
  communities,
  isLoading,
  onRefresh,
  onEndReached,
  loadingMore,
  onJoinPress,
}: CommunityListProps) {
  const { styles } = useTheme(createStyles)

  const renderEmptyState = () => (
    <Text variant="body" style={styles.emptyState}>
      No communities yet. Create or join one!
    </Text>
  )

  return (
    <View style={styles.listSection}>


      {communities.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={communities}
          renderItem={({ item }) => <CommunityCard community={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} /> : undefined}
        />
      )}
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  listSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  listContent: {
    gap: 12,
  },
  emptyState: {
    textAlign: 'center',
    marginTop: 24,
  },
})

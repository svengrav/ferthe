import { Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { Theme, useTheme } from '@app/shared/theme'
import { Community } from '@shared/contracts/communities'
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native'
import CommunityCard from './CommunityCard'

interface CommunityListProps {
  communities: Community[]
  isLoading: boolean
  onRefresh: () => void
  onEndReached?: () => void
  loadingMore?: boolean
}

export function CommunityList({
  communities,
  isLoading,
  onRefresh,
  onEndReached,
  loadingMore,
}: CommunityListProps) {
  const { styles } = useTheme(createStyles)
  const { locales } = useLocalization()

  const renderEmptyState = () => (
    <Text variant="body" style={styles.emptyState}>
      {locales.community.noCommunities}
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
  listContent: {
    gap: 12,
  },
  emptyState: {
    textAlign: 'center',
    marginTop: 24,
  },
})

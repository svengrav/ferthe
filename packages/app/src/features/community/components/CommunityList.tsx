import { Button, Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { Community } from '@shared/contracts/communities'
import { FlatList, StyleSheet, View } from 'react-native'
import CommunityCard from './CommunityCard'
import { useCommunityCreatorCard } from './CommunityCreatorCard.tsx'

interface CommunityListProps {
  communities: Community[]
  isLoading: boolean
  onRefresh: () => void
  onJoinPress: () => void
}

export function CommunityList({
  communities,
  isLoading,
  onRefresh,
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
      <View style={styles.header}>
        <Text variant="section">My Communities</Text>
        <View style={styles.actions}>
          <Button icon="person-add" onPress={onJoinPress} />
          <Button icon="add" onPress={useCommunityCreatorCard().showCommunityCreatorCard} />
        </View>
      </View>

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

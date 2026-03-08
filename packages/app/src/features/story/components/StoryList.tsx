import { Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { Story } from '@shared/contracts'
import { View } from 'react-native'
import StoryCard from './StoryCard'

interface StoryListProps {
  stories: Story[]
  loading: boolean
}

function StoryList({ stories, loading }: StoryListProps) {
  const { styles } = useTheme(useStyles)
  const { locales } = useLocalization()

  if (!loading && stories.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="caption">{locales.discovery.noStories}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {stories.map(story => (
        <StoryCard key={story.id} story={story} />
      ))}
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    gap: theme.tokens.spacing.lg,
    paddingBottom: theme.tokens.spacing.xl,
  },
  empty: {
    paddingVertical: theme.tokens.spacing.xl,
    alignItems: 'center',
  },
}))

export default StoryList

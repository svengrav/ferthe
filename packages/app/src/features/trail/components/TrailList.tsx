import { Button, Divider, FertheLogo, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { Trail } from '@shared/contracts'
import { FlatList, View } from 'react-native'
import TrailItem from './TrailItem'
import { useTrailPage } from './TrailPage'

const INTRO_PADDING = 16
const INTRO_MAX_WIDTH = 200
const INTRO_MARGIN_TOP = 10
const INTRO_MARGIN_BOTTOM = 25
const INTRO_LINE_HEIGHT = 30
const LOGO_MARGIN_BOTTOM = 10

interface TrailListProps {
  trails: Trail[]
  isRefreshing?: boolean
  onRefresh?: () => void
  onOpenTrail: (trail: Trail) => void
}

/**
 * Displays the list of trails with a FlatList or an empty state intro when no trails are available.
 */
function TrailList(props: TrailListProps) {
  const { trails, isRefreshing, onRefresh, onOpenTrail } = props
  const { styles } = useTheme(useStyles)
  const { locales } = useLocalization()

  if (!styles) return null

  if (trails.length === 0) {
    return (
      <View style={styles.intro}>
        <FertheLogo style={styles.logo} />
        <Text style={styles.introText}>{locales.trails.everyJourney}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={trails}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <Divider size="none" />}
      renderItem={({ item }) => (
        <TrailItem
          trail={item}
          onPress={() => onOpenTrail(item)}
          actions={
            <Button icon="chevron-right" variant="secondary" onPress={() => onOpenTrail(item)} />
          }
        />
      )}
      keyExtractor={item => item.id}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
    />
  )
}

const useStyles = createThemedStyles(theme => ({
  intro: {
    padding: INTRO_PADDING,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    maxWidth: INTRO_MAX_WIDTH,
    textAlign: 'center',
    color: theme.colors.onBackground,
    marginTop: INTRO_MARGIN_TOP,
    marginBottom: INTRO_MARGIN_BOTTOM,
    lineHeight: INTRO_LINE_HEIGHT,
  },
  logo: {
    marginBottom: LOGO_MARGIN_BOTTOM,
  },
  listContent: {},
}))

export default TrailList

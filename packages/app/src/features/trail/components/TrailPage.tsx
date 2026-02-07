import { StyleSheet, View } from 'react-native'

import { Button, Image, Page, PageTab, PageTabs, Stack, Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { Trail } from '@shared/contracts'
import { useEffect } from 'react'

const IMAGE_HEIGHT = 150

interface TrailPageProps {
  onBack?: () => void
  trail: Trail
}

/**
 * Displays comprehensive information about a trail including name, image, and description.
 */
function TrailPage(props: TrailPageProps) {
  const { trail, onBack } = props
  const { styles } = useTheme(createStyles)
  const { context, locales } = useApp()

  // Request trail spot previews on mount or trail change
  useEffect(() => {
    context?.trailApplication.requestTrailSpotPreviews(trail.id)
  }, [trail.id, context])

  return (
    <Page
      style={styles.container}
      title={trail.name}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onBack} />}
      trailing={<Button icon="more-vert" variant="outlined" options={[]} />}
    >
      <PageTabs variant="chips" defaultTab="overview">
        <PageTab id="overview" label={locales.trails.overview}>
          <Stack spacing='md'>
            <Image
              style={styles.image}
              source={trail.image}
              height={IMAGE_HEIGHT}
              resizeMode="cover"
            />
            <Text variant="section">{locales.trails.description}</Text>
            <Text variant="body">{trail.description}</Text>
            <Text variant="body">{trail.updatedAt.toDateString()}</Text>
          </Stack>
        </PageTab>
        <PageTab id="spots" label={locales.trails.spots}>
          <View />
        </PageTab>
      </PageTabs>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.tokens.spacing.sm,
  },
  image: {
    borderRadius: theme.tokens.borderRadius.md,
  },
})

export default TrailPage

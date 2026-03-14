import { Button, Chip, Divider, FertheLogo, LoadingSpinner, Page, PulseAnimation, SectionHeader, Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { useFeedbackPage } from '@app/shared/feedback/'
import { Theme, useThemeStore } from '@app/shared/theme'
import Constants from 'expo-constants'
import { Linking, StyleSheet } from 'react-native'
import BlogPostCard from './components/BlogPostCard'
import { useBlogPosts } from './hooks/useBlogPosts'

export default function AboutScreen() {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const { locales } = useLocalization()
  const { posts, loading } = useBlogPosts()
  const { showFeedback, label: feedbackLabel } = useFeedbackPage()

  const version = Constants.expoConfig?.version ?? '–'
  const environment = (Constants.expoConfig?.extra?.environment as string | undefined)?.substring(0, 3)

  const handleOpenLink = () => {
    Linking.openURL('https://ferthe.de')
  }

  return (
    <Page
      screen
      scrollable
    >
      <Stack>

        <Stack direction='horizontal' justify='end' align='center' flex>
          <Chip variant='secondary' size='sm' label={`v${version}${environment ? ` · ${environment}` : ''}`} />
        </Stack>

        <PulseAnimation style={{ alignSelf: 'center', marginBottom: 10 }}>
          <FertheLogo style={styles.logo} fill={theme.colors.primary} />
        </PulseAnimation>

        <Text variant='body'>{locales.about.storyIntro}</Text>
        {/* <Text variant='body'>{locales.about.aboutText}</Text> */}
        <Text variant='body'>{locales.about.followYourTrail}</Text>
        <Stack direction='horizontal' justify='center' align='center' flex>
          <Button label={locales.about.fertheWebsite} icon='home' variant='outlined' onPress={handleOpenLink} style={{ alignSelf: 'center' }} />
          <Button label={feedbackLabel} icon='send' variant='outlined' onPress={showFeedback} style={{ alignSelf: 'center' }} />
        </Stack>
        <Divider />
        <SectionHeader title={locales.about.latestPosts} />
        {loading ? (
          <LoadingSpinner />
        ) : (
          posts.map(post => <BlogPostCard key={post.slug} post={post} />)
        )}
      </Stack>
    </Page>
  )
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    logo: {
      width: 140,
      height: 140,
    },
    sectionTitle: {
      marginTop: 12,
      alignSelf: 'flex-start',
    },
    meta: {
      textAlign: 'center',
      opacity: 0.5,
    },
  })
}

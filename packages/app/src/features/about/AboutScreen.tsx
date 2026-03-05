import { Button, Divider, FertheLogo, LoadingSpinner, Page, PulseAnimation, SectionHeader, Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { Theme, useThemeStore } from '@app/shared/theme'
import { Linking, StyleSheet } from 'react-native'
import BlogPostCard from './components/BlogPostCard'
import { useBlogPosts } from './hooks/useBlogPosts'

export default function AboutScreen() {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const { locales } = useLocalization()
  const { posts, loading } = useBlogPosts()

  const handleOpenLink = () => {
    Linking.openURL('https://ferthe.de')
  }

  return (
    <Page scrollable >
      <Stack>
        <PulseAnimation style={{ alignSelf: 'center', paddingVertical: 20 }}>
          <FertheLogo style={styles.logo} fill={theme.colors.primary} />
        </PulseAnimation>
        <Text variant='body'>{locales.about.storyIntro}</Text>
        <Text variant='body'>{locales.about.aboutText}</Text>
        <Text variant='body'>{locales.about.followYourTrail}</Text>
        <Button label={locales.about.fertheWebsite} variant='primary' onPress={handleOpenLink} style={{ alignSelf: 'center' }} />
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
  })
}

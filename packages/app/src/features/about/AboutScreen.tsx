import { Button, FertheLogo, Page, PulseAnimation, Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { Theme, useThemeStore } from '@app/shared/theme'
import { Linking, StyleSheet } from 'react-native'

export default function AboutScreen() {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const { locales } = useLocalization()

  const handleOpenLink = () => {
    Linking.openURL('https://ferthe.de')
  }

  return (
    <Page scrollable>
      <Stack style={styles.container}>
        <PulseAnimation>
          <FertheLogo style={styles.logo} fill={theme.colors.primary} />
        </PulseAnimation>
        <Text variant='body'>{locales.about.storyIntro}</Text>
        <Text variant='body'>{locales.about.aboutText}</Text>
        <Text variant='body'>{locales.about.followYourTrail}</Text>
        <Button label={locales.about.fertheWebsite} variant='primary' onPress={handleOpenLink} />
      </Stack>
    </Page>
  )
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginTop: 24,
      paddingHorizontal: 12,
      flex: 1,
      gap: 10,
      alignItems: 'center',
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20
    },
  })
}

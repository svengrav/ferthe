import { Button, FertheLogo, Page, PulseAnimation, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { Linking, StyleSheet, View } from 'react-native'

export default function AboutScreen() {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const { t } = useLocalizationStore()

  const handleOpenLink = () => {
    Linking.openURL('https://ferthe.de')
  }

  return (
    <Page scrollable>
      <View style={styles.container}>
        <Text variant='heading'>Hi!</Text>
        <PulseAnimation>
          <FertheLogo style={styles.logo} fill={theme.colors.primary} />
        </PulseAnimation>
        <Text variant='body'>{t.about.storyIntro}</Text>
        <Text variant='body'>{t.about.aboutText}</Text>
        <Text variant='body'>{t.about.followYourTrail}</Text>
        <Button label={t.about.fertheWebsite} variant='primary' onPress={handleOpenLink} />
      </View>
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
      marginBottom: 60
    },
  })
}

import { Button, Page, PulseAnimation, Text } from '@app/shared/components'
import { Card, FertheLogo } from '@app/shared/components'
import { View, StyleSheet, Linking } from 'react-native'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'

export default function AboutScreen() {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const { t } = useLocalizationStore()

  const handleOpenLink = () => {
    Linking.openURL('https://ferthe.de')
  }

  return (
    <Page scrollable>
      <Card style={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <PulseAnimation>
            <FertheLogo style={styles.logo} fill={theme.colors.onBackground} />
          </PulseAnimation>
          <Text style={styles.introText}>{t.about.storyIntro}</Text>
          <Text style={styles.aboutText}>{t.about.aboutText}</Text>
          <Text style={styles.introText}>{t.about.followYourTrail}</Text>
          <Button label={'ferthe.eu'} variant='outlined' onPress={handleOpenLink} />
        </View>
      </Card>
    </Page>
  )
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      minHeight: '100%',
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20,
    },
    introText: {
      fontFamily: theme.text.primary.semiBold,
      ...theme.text.size.md,
      lineHeight: 28,
      color: theme.colors.onBackground,
      textAlign: 'center',
      marginBottom: 30, // Add spacing between paragraphs
    },
    aboutText: {
      ...theme.text.size.md,
      color: theme.colors.onBackground,
      textAlign: 'center',
      marginBottom: 30, // Add spacing between paragraphs
    },
    linkText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontFamily: theme.text.primary.semiBold,
    },
  })
}

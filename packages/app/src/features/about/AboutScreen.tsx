import { Button, Card, FertheLogo, Page, PulseAnimation, Text } from '@app/shared/components'
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
      <Card style={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <PulseAnimation>
            <FertheLogo style={styles.logo} fill={theme.colors.onBackground} />
          </PulseAnimation>
          <Text variant='body'>{t.about.storyIntro}</Text>
          <Text variant='body'>{t.about.aboutText}</Text>
          <Text variant='body'>{t.about.followYourTrail}</Text>
          <Button label={'ferthe.eu'} variant='outlined' onPress={handleOpenLink} />
        </View>
      </Card>
    </Page>
  )
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 8,
      flex: 1,
      gap: 10,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100%',
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20,
    },
  })
}

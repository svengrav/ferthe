import { Theme, useThemeStore } from '@app/shared/theme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import PulseAnimation from '../animation/PulseAnimation'
import { FertheLabel, FertheLogo } from './Logo'

/**
 * Einfacher Splash Screen ohne Logik
 * Initialisierung läuft in useAppInitialization Hook
 */
const SplashView: React.FC = () => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <View style={styles.loadingOverlay}>
      <PulseAnimation>
        <FertheLogo style={styles.logo} fill={theme.colors.onBackground} />
        <FertheLabel style={styles.label} fill={theme.colors.onBackground} />
      </PulseAnimation>
    </View>
  )
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    loadingOverlay: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      minHeight: '100%',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20,
    },
    label: {
      height: 30,
      marginBottom: 40,
    },
  })
}

export default SplashView


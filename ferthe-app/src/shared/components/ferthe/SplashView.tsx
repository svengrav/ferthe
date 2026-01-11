import { Theme, useThemeStore } from '@app/shared/theme'
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import {
  Merriweather_400Regular,
  Merriweather_600SemiBold,
  Merriweather_700Bold
} from '@expo-google-fonts/merriweather'
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import PulseAnimation from '../animation/PulseAnimation'
import { FertheLabel, FertheLogo } from './Logo'

const loadFonts = async () => {
  await Font.loadAsync({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Merriweather_400Regular,
    Merriweather_600SemiBold,
    Merriweather_700Bold,
  })
}

SplashScreen.preventAutoHideAsync()

const SplashScreenWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false)
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const fadeAnimation = useRef(new Animated.Value(1)).current // Initial opacity is 1
  useEffect(() => {
    console.log('Loading fonts and preparing app...')
    const prepareApp = async () => {
      try {
        await loadFonts()
      } catch (e) {
        console.warn(e)
      } finally {
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          console.log('Fonts loaded and animation completed')
          SplashScreen.hideAsync()
          setIsReady(true)
        })
      }
    }

    prepareApp()
  }, [fadeAnimation])

  if (!isReady) {
    return (
      <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnimation }]}>
        <PulseAnimation>
          <FertheLogo style={styles.logo} fill={theme.colors.onBackground} />
          <FertheLabel style={styles.label} fill={theme.colors.onBackground} />
        </PulseAnimation>
      </Animated.View>
    )
  }

  return <View style={styles.container}>{children}</View>
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingOverlay: {
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
    label: {
      height: 30,
      marginBottom: 20,
    },
  })
}

export default SplashScreenWrapper

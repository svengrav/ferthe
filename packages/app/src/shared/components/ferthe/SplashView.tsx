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
import { Animated, StyleSheet, Text, View } from 'react-native'
import PulseAnimation from '../animation/PulseAnimation'
import { FertheLabel, FertheLogo } from './Logo'
import { useStatusCheck } from './useStatusCheck'

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

interface SplashScreenWrapperProps {
  children: React.ReactNode
  checkStatus?: () => Promise<{ available: boolean; latency?: number; error?: string }>
}

const SplashScreenWrapper: React.FC<SplashScreenWrapperProps> = ({ children, checkStatus }) => {
  const [isReady, setIsReady] = useState(false)
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [healthCheckPassed, setHealthCheckPassed] = useState(!checkStatus)
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const fadeAnimation = useRef(new Animated.Value(1)).current

  const { isChecking, progress } = useStatusCheck({
    checkStatus: checkStatus || (async () => ({ available: true })),
    retryInterval: 3000,
    onSuccess: () => setHealthCheckPassed(true),
  })

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await loadFonts()
        setFontsLoaded(true)
      } catch (e) {
        console.warn(e)
        setFontsLoaded(true)
      }
    }

    prepareApp()
  }, [])

  useEffect(() => {
    if (fontsLoaded && healthCheckPassed && !isReady) {
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        SplashScreen.hideAsync()
        setIsReady(true)
      })
    }
  }, [fontsLoaded, healthCheckPassed, isReady, fadeAnimation])

  if (!isReady) {
    return (
      <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnimation }]}>
        <PulseAnimation>
          <FertheLogo style={styles.logo} fill={theme.colors.onBackground} />
          <FertheLabel style={styles.label} fill={theme.colors.onBackground} />
        </PulseAnimation>

        {fontsLoaded && checkStatus && (
          <>
            {isChecking ? (
              <Text style={styles.statusText}>Try to connect...</Text>
            ) : (
              <>
                <Text style={styles.statusText}>No connection...</Text>
              </>
            )}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
             </View>
          </>
        )}
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
    statusText: {
      fontSize: 16,
      color: theme.colors.onBackground,
      marginTop: 20,
      fontFamily: 'Inter_400Regular',
    },
    errorDetail: {
      fontSize: 12,
      color: theme.colors.onSecondary,
      fontFamily: 'Inter_400Regular',
      marginBottom: 20,
    },
    progressContainer: {
      width: '30%',
      height: 4,
      backgroundColor: theme.colors.secondary,
      borderRadius: 2,
      overflow: 'hidden',
      marginVertical: 20,
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
  })
}

export default SplashScreenWrapper

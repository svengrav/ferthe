import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import {
  Merriweather_400Regular,
  Merriweather_600SemiBold,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather'
import * as Font from 'expo-font'
import { useEffect } from 'react'
import { logger } from '../shared/utils/logger'
import { useInitStore } from './useInitializationPipeline'

/**
 * Hook that loads all required fonts for the app.
 * Sets fontsReady flag when complete.
 */
export function useFontInitialization() {
  const { setFontsReady } = useInitStore()

  useEffect(() => {
    async function loadFonts() {
      try {
        logger.log('[FontInit] Loading fonts...')

        await Font.loadAsync({
          Inter_400Regular,
          Inter_600SemiBold,
          Inter_700Bold,
          Merriweather_400Regular,
          Merriweather_600SemiBold,
          Merriweather_700Bold,
        })

        logger.log('[FontInit] Fonts loaded successfully')
        setFontsReady()
      } catch (error) {
        logger.error('[FontInit] Failed to load fonts:', error)
        // Set ready anyway to not block app
        setFontsReady()
      }
    }

    loadFonts()
  }, [])
}

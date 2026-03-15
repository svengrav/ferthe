import Constants from 'expo-constants'
import { useEffect } from 'react'
import { useSystemStore } from '../features/system/systemStore'
import { shouldShowUpdate } from '../features/system/versionService'
import { getAppContextStore } from '../shared/stores/appContextStore'
import { logger } from '../shared/utils/logger'
import { useInitStore } from './initStore'

const DISMISSED_VERSION_KEY = 'update_dismissed_version'

export function useVersionCheck() {
  const appContextReady = useInitStore(state => state.appContextReady)
  const { setVersionCheckReady } = useInitStore()
  const { setBlockingUpdate, dismissBlockingUpdate } = useSystemStore()

  useEffect(() => {
    if (!appContextReady) return

    async function checkUpdate() {
      try {
        const { api, secureStore } = getAppContextStore()

        const currentVersion = Constants.expoConfig?.version
        if (!currentVersion) {
          logger.log('[VersionCheck] Current app version not found, skipping update check')
          setVersionCheckReady()
          return
        }

        const { data: update, error } = await api.system.getAppUpdate()
        if (error) {
          logger.error('[VersionCheck] Failed to fetch update:', error.message)
          setVersionCheckReady()
          return
        }
        if (!update) {
          setVersionCheckReady()
          return
        }

        const dismissedVersion = update.force || !secureStore
          ? null
          : await secureStore.read<string>(DISMISSED_VERSION_KEY)

        if (!shouldShowUpdate(update, currentVersion, dismissedVersion)) {
          setVersionCheckReady()
          return
        }

        logger.log(`[VersionCheck] Update available: ${currentVersion} -> ${update.minAppVersion} (force=${update.force})`)

        const onClose = update.force || !secureStore
          ? undefined
          : async () => {
            await secureStore.write(DISMISSED_VERSION_KEY, update.minAppVersion)
            dismissBlockingUpdate()
            setVersionCheckReady()
          }

        setBlockingUpdate(update, onClose)
        // versionCheckReady is NOT set here — pipeline unblocks only after user dismisses (onClose)
        // or never for force updates.
      } catch (error) {
        logger.error('[VersionCheck] Failed to check update:', error)
        setVersionCheckReady()
      }
    }

    checkUpdate()
  }, [appContextReady])
}

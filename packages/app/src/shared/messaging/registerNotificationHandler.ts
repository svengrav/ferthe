import { logger } from '@app/shared/utils/logger'
import { getMessaging } from '@react-native-firebase/messaging'
import { AuthorizationStatus } from '@react-native-firebase/messaging'
import { DevicePlatform } from '@shared/contracts'
import { Platform } from 'react-native'
import { getAppContextStore } from '../stores/appContextStore'

// Request permission to receive notifications
export async function getToken() {
  try {
    const messagingInstance = getMessaging()
    const token = await messagingInstance.getToken()
    return token
  } catch (error) {
    logger.error('Failed to get FCM token:', error)
    return undefined
  }
}

/**
 * Requests permission to receive push notifications and retrieves the FCM token.
 * @returns The FCM token if the user has granted permission, otherwise undefined.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Skip push notifications on web (only supported on iOS/Android)
  if (Platform.OS === 'web') {
    logger.log('[Push] Skipping push notification registration on web')
    return undefined
  }

  try {
    // Firebase is initialized natively via google-services.json / GoogleService-Info.plist
    const messagingInstance = getMessaging()
    const authStatus = await messagingInstance.requestPermission()
    const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL

    if (!enabled) return

    const token = await messagingInstance.getToken().catch((error) => {
      // FIS_AUTH_ERROR: SHA fingerprint not registered in Firebase Console
      if (error.message?.includes('FIS_AUTH_ERROR')) {
        logger.error('[Push] Firebase authentication failed - SHA fingerprint missing in Firebase Console')
        logger.error('[Push] Add your app\'s SHA-1/SHA-256 to Firebase Console → Android App → SHA certificate fingerprints')
      }
      throw error
    })

    // Send token to backend
    if (token) await syncTokenToBackend(token)

    // Listen for token refresh
    messagingInstance.onTokenRefresh(async (newToken) => {
      await syncTokenToBackend(newToken)
    })

    return token
  } catch (error) {
    logger.error('Failed to register for push notifications:', error)
    return
  }
}

// Send FCM token to backend for push delivery
async function syncTokenToBackend(token: string): Promise<void> {
  try {
    const platform = Platform.OS as DevicePlatform
    if (platform !== 'ios' && platform !== 'android') return

    const { accountApplication } = getAppContextStore()
    await accountApplication.registerDeviceToken(token, platform)
    logger.log('[Push] Device token synced to backend')
  } catch (error) {
    logger.error('[Push] Failed to sync device token:', error)
  }
}

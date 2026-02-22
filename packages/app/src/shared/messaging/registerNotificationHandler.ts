import { getSession } from '@app/features/account/stores/accountStore'
import { logger } from '@app/shared/utils/logger'
import { getApps, initializeApp } from '@react-native-firebase/app'
import { AuthorizationStatus, getMessaging } from '@react-native-firebase/messaging'
import { DevicePlatform, FirebaseConfig } from '@shared/contracts'
import { Platform } from 'react-native'
import { getAppContextStore } from '../stores/appContextStore'

let firebaseConfig: FirebaseConfig | null = null

// Fetch Firebase configuration from API
async function getFirebaseConfig(): Promise<FirebaseConfig | null> {
  if (firebaseConfig) return firebaseConfig

  try {
    const session = getSession()
    if (!session?.accountId) {
      logger.error('No account session available for Firebase config')
      return null
    }

    const { accountApplication } = getAppContextStore()
    const result = await accountApplication.getFirebaseConfig()

    if (result.success && result.data) {
      firebaseConfig = result.data
      return firebaseConfig
    } else {
      logger.error('Failed to fetch Firebase config:', result.error)
      return null
    }
  } catch (error) {
    logger.error('Error fetching Firebase config:', error)
    return null
  }
}

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
    // Get Firebase configuration from API
    const config = await getFirebaseConfig()
    if (!config) {
      logger.error('Cannot initialize Firebase: No configuration available')
      return undefined
    }

    // Initialize Firebase if not already initialized
    if (getApps().length === 0) {
      await initializeApp(config)
    }

    const messagingInstance = getMessaging()
    const authStatus = await messagingInstance.requestPermission()
    const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL

    if (!enabled) return

    const token = await messagingInstance.getToken().catch((error) => {
      // FIS_AUTH_ERROR: SHA fingerprint not registered in Firebase Console
      console.log(JSON.stringify(error.message))
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

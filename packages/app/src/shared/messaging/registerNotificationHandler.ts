import { getSession } from '@app/features/account/stores/accountStore'
import { logger } from '@app/shared/utils/logger'
import { getApps, initializeApp } from '@react-native-firebase/app'
import { AuthorizationStatus, getMessaging } from '@react-native-firebase/messaging'
import { FirebaseConfig } from '@shared/contracts'
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

    return await messagingInstance.getToken()
  } catch (error) {
    logger.error('Failed to register for push notifications:', error)
    return
  }
}

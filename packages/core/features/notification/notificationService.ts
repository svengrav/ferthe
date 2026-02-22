// Notification service: sends push notifications to users via their registered device tokens
import { FirebaseConnector } from '@core/connectors/firebaseConnector.ts'
import { Store } from '@core/store/storeFactory.ts'
import { DeviceToken } from '@shared/contracts/index.ts'

export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
}

export interface NotificationService {
  sendToUser: (accountId: string, payload: NotificationPayload) => Promise<void>
}

interface NotificationServiceOptions {
  deviceTokenStore: Store<DeviceToken>
  firebaseConnector?: FirebaseConnector
}

export function createNotificationService(options: NotificationServiceOptions): NotificationService {
  const { deviceTokenStore, firebaseConnector } = options

  const sendToUser = async (accountId: string, payload: NotificationPayload): Promise<void> => {
    if (!firebaseConnector) {
      console.warn('[Notification] Firebase connector not configured — skipping push')
      return
    }

    const tokensResult = await deviceTokenStore.list()
    if (!tokensResult.success || !tokensResult.data) return

    const userTokens = tokensResult.data.filter(t => t.accountId === accountId)
    if (userTokens.length === 0) return

    const sendPromises = userTokens.map(async (dt) => {
      try {
        await firebaseConnector.sendPushNotification({
          token: dt.token,
          userContent: { title: payload.title, body: payload.body },
          appData: payload.data,
        })
      } catch (error) {
        console.error(`[Notification] Failed to send push to token ${dt.id}:`, error)
      }
    })

    await Promise.allSettled(sendPromises)
  }

  return { sendToUser }
}

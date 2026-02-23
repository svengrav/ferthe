import { logger } from "@app/shared/utils/logger"
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native'
import { AuthorizationStatus, getMessaging } from '@react-native-firebase/messaging'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { appNavigator } from "../shared/navigation/navigationRef"

// Request user permission for notifications
// This is required for iOS and Android 13+ devices
async function requestUserPermission() {
  const messagingInstance = getMessaging()
  const authStatus = await messagingInstance.requestPermission()
  const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL

  if (enabled) {
    logger.log('Authorization status:', authStatus)
  }

  if (Platform.OS === 'android') {
    await notifee.requestPermission()
  }
}

// Create notification channels for Android
async function setupNotificationChannels() {
  // Required for Android
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      vibration: true,
      visibility: AndroidVisibility.PUBLIC,
    })

    // Create a channel specifically for trail updates
    await notifee.createChannel({
      id: 'trails',
      name: 'Trail Updates',
      description: 'Notifications for trail updates and discoveries',
      importance: AndroidImportance.HIGH,
      vibration: true,
      visibility: AndroidVisibility.PUBLIC,
    })
  }
}

// Display a notification using Notifee with action buttons
async function displayNotification(title: string, body: string, data?: any) {
  // Define which screen to navigate to based on notification type
  const screenDestination = data?.type === 'finding' ? 'Feed' : 'Trails'

  await notifee.displayNotification({
    id: `notification-${Date.now()}`,
    title,
    body,
    data,
    android: {
      channelId: data?.type === 'finding' ? 'trails' : 'default',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      style: { type: AndroidStyle.BIGTEXT, text: body },
      category: AndroidCategory.MESSAGE,
      actions: [
        {
          title: 'View',
          pressAction: {
            id: 'view',
            launchActivity: 'default',
          },
        },
        {
          title: 'Dismiss',
          pressAction: {
            id: 'dismiss',
          },
        },
      ],
    },
    ios: {
      // iOS doesn't support buttons in the same way but we can add categories
      categoryId: 'message',
      attachments: [],
    },
  })
}

// Handle FCM messages and convert to Notifee notifications
async function onMessageReceived(message: any) {
  // Extract notification data from FCM message
  const { notification, data } = message

  // Display using Notifee
  if (notification) {
    await displayNotification(notification.title || 'New Message', notification.body || '', data)
  }
}

// Hook to handle foreground notifications
function showNotificationHook() {
  useEffect(() => {
    // Setup notification categories for iOS
    if (Platform.OS === 'ios') {
      notifee.setNotificationCategories([
        {
          id: 'message',
          actions: [
            {
              id: 'view',
              title: 'View',
              foreground: true,
            },
            {
              id: 'dismiss',
              title: 'Dismiss',
              destructive: true,
            },
          ],
        },
      ])
    }

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DELIVERED:
          break

        case EventType.PRESS:
          handleNotificationPress(detail.notification)
          break

        case EventType.ACTION_PRESS:
          if (detail.pressAction) handleActionPress(detail.pressAction?.id, detail.notification)
          break
      }
    })

    // Register the background event handler
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        handleNotificationPress(detail.notification)
      } else if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction) await handleActionPress(detail.pressAction.id, detail.notification)
      }
    })

    return unsubscribe
  }, [])
}

// Handle notification press events
function handleNotificationPress(notification?: any) {
  if (!notification) return

  // Navigate based on notification data
  if (notification.data?.type === 'finding') {
    appNavigator.toFindings()
  } else {
    appNavigator.toTrails()
  }
}

// Handle action button press events
async function handleActionPress(actionId: string, notification?: any) {
  switch (actionId) {
    case 'view':
      handleNotificationPress(notification)
      break
    case 'dismiss':
      if (notification?.id) {
        await notifee.cancelNotification(notification.id)
      }
      break
  }
}

/**
 * Hook that initializes push notification handling for the app.
 * Sets up Firebase Cloud Messaging (FCM) and Notifee for displaying notifications.
 * Handles foreground and background notifications, permissions, and user interactions.
 */
export function usePushNotifications() {
  // Handle Notifee foreground events (must be called unconditionally)
  showNotificationHook()

  useEffect(() => {
    // Skip notification handler on web (only supported on iOS/Android)
    if (Platform.OS === 'web') {
      logger.log('[Push] Skipping notification handler on web')
      return
    }

    requestUserPermission()
    setupNotificationChannels()

    const messagingInstance = getMessaging()
    messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
      await onMessageReceived(remoteMessage)
    })

    const unsubscribeForeground = messagingInstance.onMessage(async remoteMessage => {
      await onMessageReceived(remoteMessage)
    })
    return () => {
      unsubscribeForeground()
    }
  }, [])
}

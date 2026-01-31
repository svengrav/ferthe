import { Theme, useThemeStore } from '@app/shared/theme'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { create } from 'zustand'

interface NotificationState {
  visible: boolean
  showNotification: () => void
  hideNotification: () => void
  notification: { title: string; body: string }
  setNotification: (data: { title: string; body: string }) => void
}

export const useNotificationStore = create<NotificationState>()(set => ({
  visible: false,
  showNotification: () => set({ visible: true }),
  hideNotification: () => set({ visible: false }),
  notification: { title: '', body: '' },
  setNotification: data => set({ notification: data }),
}))

// Helper: Show connection error notification
let lastConnectionErrorTime = 0
const CONNECTION_ERROR_DEBOUNCE = 5000 // 5 seconds

export const showConnectionError = () => {
  const now = Date.now()

  // Debounce: Don't show multiple notifications within 5 seconds
  if (now - lastConnectionErrorTime < CONNECTION_ERROR_DEBOUNCE) {
    return
  }

  lastConnectionErrorTime = now

  const { setNotification, showNotification } = useNotificationStore.getState()
  setNotification({
    title: 'Connection Error',
    body: 'Unable to reach the server. Please check your internet connection and try again.',
  })
  showNotification()
}

const Notification = () => {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const { visible, hideNotification, notification } = useNotificationStore()

  if (notification.title === '' && notification.body === '') {
    return null // Don't show the modal if there's no notification data
  }

  return (
    <Modal animationType='fade' transparent={true} visible={visible} onRequestClose={hideNotification}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{notification.title}</Text>
          <Text style={styles.modalBody}>{notification.body}</Text>
          <TouchableOpacity style={styles.button} onPress={hideNotification}>
            <Text style={styles.textStyle}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {},
    container: {
      padding: 8,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onBackground,
      borderRadius: 8,
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
      margin: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 8,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      elevation: 5,
      width: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.colors.onSurface,
    },
    modalBody: {
      marginBottom: 15,
      color: theme.colors.onSurface,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    textStyle: {
      color: theme.colors.onPrimary,
      fontWeight: 'bold',
    },
  })

export default Notification

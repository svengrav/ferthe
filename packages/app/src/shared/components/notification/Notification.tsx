import { IconButton, Text } from '@app/shared/components/'
import { Theme } from '@app/shared/theme'
import { useThemedStyles } from '@app/shared/theme/themeStore'
import { Modal, StyleSheet, View } from 'react-native'
import { create } from 'zustand'

const MODAL_WIDTH_PERCENT = '80%'
const OVERLAY_OPACITY = 'rgba(0, 0, 0, 0.5)'

// Store
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

export const setNotification = (title: string, body: string) => {
  const { setNotification, showNotification } = useNotificationStore.getState()
  setNotification({ title, body })
  showNotification()
}

/**
 * Global notification modal component.
 * Uses Zustand store to manage notification state.
 */
function Notification() {
  const { styles } = useThemedStyles(createStyles)
  const { visible, hideNotification, notification } = useNotificationStore()

  // Don't show the modal if there's no notification data
  if (notification.title === '' && notification.body === '') {
    return null
  }

  return (
    <Modal animationType='fade' transparent={true} visible={visible} onRequestClose={hideNotification}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text variant='title'>{notification.title}</Text>
            <IconButton name='close' variant='outlined' onPress={hideNotification} />
          </View>
          <Text variant='body'>{notification.body}</Text>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: OVERLAY_OPACITY,
  },
  modalView: {
    margin: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    width: MODAL_WIDTH_PERCENT,
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
  buttonText: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
})

export default Notification

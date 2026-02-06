import { StyleSheet, View } from 'react-native'

import { Button, Text } from '@app/shared/components'
import { setOverlay } from '@app/shared/overlay'
import { closeOverlay } from '@app/shared/overlay/useOverlayStore'
import { Theme, useTheme } from '@app/shared/theme'

interface ConfirmationDialogProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Reusable confirmation dialog component.
 * Shows title, message and confirm/cancel buttons.
 */
function Dialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const { styles } = useTheme(createStyles)

  return (
    <View style={styles.container}>
      <Text variant="label">{title}</Text>
      <Text variant="body" style={styles.message}>
        {message}
      </Text>
      <View style={styles.actions}>
        <Button label={cancelText} onPress={onCancel} variant="secondary" />
        <Button
          label={confirmText}
          onPress={onConfirm}
          variant={destructive ? 'outlined' : 'primary'}
        />
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    gap: 16,
  },
  message: {
    opacity: 0.8,
  },
  actions: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
})

/**
 * Hook for opening a confirmation dialog.
 * Handles overlay management and cleanup automatically.
 */
export function useDialog() {
  return {
    openDialog: (props: ConfirmationDialogProps) => setOverlay('dialog', <Dialog {...props} />, { variant: 'compact' }),
    closeDialog: () => closeOverlay('dialog')
  }
}

export default Dialog

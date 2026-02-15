import { StyleSheet, View } from 'react-native'

import { Button, Text } from '@app/shared/components'
import { OverlayCard, closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

/**
 * Hook for opening a confirmation dialog.
 * Handles overlay management and cleanup automatically.
 */
export function useDialog() {
  return {
    openDialog: (props: ConfirmationDialogProps) => setOverlay('dialog', <Dialog {...props} />),
    closeDialog: () => closeOverlay('dialog')
  }
}

export function useRemoveDialog() {
  const { locales } = useApp()

  return {
    openDialog: (props: {
      message?: string
      onConfirm: () => void
      onCancel?: () => void
    }) => setOverlay(
      'remove-dialog',
      <Dialog
        title={locales.community.remove}
        message={props.message || locales.community.confirmRemove}
        onClose={() => closeOverlay('remove-dialog')}
        {...props}
      />
    ),
    closeDialog: () => closeOverlay('remove-dialog')
  }
}

interface ConfirmationDialogProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel?: () => void
  onClose?: () => void
}

/**
 * Reusable confirmation dialog component.
 * Shows title, message and confirm/cancel buttons.
 */
function Dialog(props: ConfirmationDialogProps) {
  const {
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    onClose
  } = props
  const { styles } = useTheme(createStyles)
  const { locales } = useApp()

  return (
    <OverlayCard title={title} onClose={onClose}>
      <Text variant="body" style={styles.message}>
        {message}
      </Text>
      <View style={styles.actions}>
        <Button
          label={cancelText || locales.common.cancel}
          onPress={onCancel}
          variant="secondary"
        />
        <Button
          label={confirmText || locales.common.confirm}
          onPress={onConfirm}
          variant="primary"
        />
      </View>
    </OverlayCard>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    gap: 16,
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
})


export default Dialog

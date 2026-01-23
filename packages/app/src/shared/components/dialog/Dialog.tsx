import { useThemeStore } from '@app/shared/theme'
import React from 'react'
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface DialogAction {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

interface DialogProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  actions?: DialogAction[]
  maxHeight?: number
  closable?: boolean
  dismissOnBackdropPress?: boolean
}

export const Dialog = ({
  visible,
  onClose,
  title,
  children,
  actions = [],
  maxHeight,
  closable = true,
  dismissOnBackdropPress = true
}: DialogProps) => {
  const theme = useThemeStore()
  const screenHeight = Dimensions.get('window').height
  const defaultMaxHeight = screenHeight * 0.8

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dialog: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      minWidth: 280,
      maxWidth: '100%',
      maxHeight: maxHeight || defaultMaxHeight,
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 16,
    },

    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.onSurface + '10',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeIcon: {
      color: theme.colors.onSurface,
      fontWeight: 'bold',
    },
    contentContainer: {
      paddingHorizontal: 24,
      paddingBottom: actions.length > 0 ? 16 : 24,
    },
    scrollContent: {
      flexGrow: 1,
    },

    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 24,
      gap: 12,
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    primaryAction: {
      backgroundColor: theme.colors.primary,
    },
    secondaryAction: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.onSurface + '30',
    },
    dangerAction: {
      backgroundColor: theme.colors.error,
    },
    disabledAction: {
      backgroundColor: theme.colors.disabled,
    },

    primaryActionText: {
      color: theme.colors.onPrimary || theme.colors.background,
    },
    secondaryActionText: {
      color: theme.colors.onSurface,
    },
    dangerActionText: {
      color: theme.colors.onError,
    },
    disabledActionText: {
      color: theme.colors.onDisabled,
    },
  })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closable ? onClose : undefined}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={closable && dismissOnBackdropPress ? onClose : undefined}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => { }}>
          {/* Header with title and close button */}
          <View style={styles.dialog}>
            {(title || closable) && (
              <View style={styles.header}>
                {title && (
                  <Text  numberOfLines={2}>
                    {title}
                  </Text>
                )}
                {closable && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.closeIcon}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Scrollable content */}
            <ScrollView
              style={styles.contentContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {typeof children === 'string' ? (
                <Text>{children}</Text>
              ) : (
                children
              )}
            </ScrollView>

            {/* Actions */}
            {actions.length > 0 && (
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={action.disabled ? undefined : action.onPress}
                    disabled={action.disabled}
                  >
                    <Text>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

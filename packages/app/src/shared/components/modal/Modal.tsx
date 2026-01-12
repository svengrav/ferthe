import { Theme, useThemeStore } from '@app/shared/theme'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ReactNativeModal } from 'react-native-modal'
import { IconButton } from '../button/Button'
import Text from '../text/Text'
import { Option } from '../types'

interface ModalProps {
  label?: string
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  scrollable?: boolean
}

const ModalHeader = ({ label, onClose }: { label?: string; options?: Option[]; onClose: () => void }) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <View style={styles.actions}>
      <Text size='large'>{label}</Text>
      <IconButton onPress={onClose} name='close' variant='outlined' size={20} />
    </View>
  )
}

const Modal = ({ visible, label, onClose, children, scrollable }: ModalProps) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  const ContentContainer = scrollable ? ScrollView : View
  const contentProps = scrollable ? { contentContainerStyle: { flexGrow: 1 } } : {}

  return (
    <ReactNativeModal style={styles.modal} isVisible={visible}>
      <View style={styles.surface}>
        <ModalHeader label={label} onClose={onClose} />
        <ContentContainer
          {...contentProps}
          style={styles.contentContainer}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={true}
          bounces={true}>
          {children}
        </ContentContainer>
      </View>
    </ReactNativeModal>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    actions: {
      justifyContent: 'space-between',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 8,
      borderRadius: 8,
      gap: 8,
    },
    surface: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 8,
    },
    contentContainer: {
      flex: 1,
      gap: 12,
      padding: 8,
      borderRadius: 8,
    },
    modal: {
      padding: 16,
      flex: 1,
      margin: 0,
    },
  })

export default Modal

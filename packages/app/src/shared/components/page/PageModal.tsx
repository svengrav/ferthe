import { Theme, useThemeStore } from '@app/shared/theme'
import { ScrollView, StyleSheet } from 'react-native'
import Modal from 'react-native-modal'
import { IconButton } from '../button/Button'
import { Option } from '../types'
import { PageHeader } from './PageHeader'

interface PageModalProps {
  label?: string
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  options?: Option[]
}

const PageModal = ({ visible, label, onClose, children, options }: PageModalProps) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <Modal style={styles.modal} isVisible={visible}>
      <PageHeader
        label={label}
        options={options}
        action={<IconButton onPress={onClose} name='arrow-back' size={24} />}
      />
      <ScrollView
        contentContainerStyle={styles.scrolLView}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={true}
        bounces={true}>
        {children}
      </ScrollView>
    </Modal>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    scrolLView: {
      gap: 12,
      padding: 12,
      borderRadius: 8,
      color: theme.colors.onSurface,
    },
    modal: {
      flex: 1,
      backgroundColor: theme.colors.background,
      margin: 0,
    },
  })

export default PageModal

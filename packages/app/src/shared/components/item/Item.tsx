import { StyleSheet, View } from 'react-native'

import { setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import Button from '../button/Button'
import Field from '../field/Field'
import Icon, { IconName } from '../icon/Icon'
import Text from '../text/Text'
import { ComponentSize, ComponentVariant } from '../types'
import ItemTextEditor from './ItemTextEditor'

interface ItemProps {
  icon?: IconName
  label: string
  value?: string | null
  variant?: ComponentVariant
  size?: ComponentSize
  iconColor?: string
  type?: 'text' | 'multiline'
  iconSize?: number
  action?: React.ReactNode
  onPress?: () => void
  editable?: boolean
  onEdit?: () => void
  onSubmitEdit?: (newValue: string) => Promise<void>
}

/**
 * Reusable item component for displaying labeled information with optional icon and edit functionality.
 * Can be made editable to allow inline editing via overlay.
 */
function Item(props: ItemProps) {
  const {
    icon,
    label,
    value,
    iconColor,
    iconSize = 20,
    action,
    onEdit,
    variant = 'secondary',
    size = 'md',
    editable = false,
    onSubmitEdit,
    type = 'text',
  } = props

  const { styles, theme } = useTheme(createStyles)

  // Open edit overlay or call custom onEdit handler
  const handleOnEdit = () => {
    if (!editable) return

    if (onEdit) {
      onEdit()
    } else if (onSubmitEdit) {
      const close = setOverlay(
        'edit-item',
        <ItemTextEditor
          value={value || ''}
          multiline={type === 'multiline'}
          onSubmit={async (newValue) => {
            await onSubmitEdit(newValue)
            close()
          }}
        />
      )
    }
  }

  return (
    <Field style={styles.fieldContainer}>
      <View style={styles.iconContainer}>
        {icon && (
          <Icon
            name={icon}
            size='md'
            color={iconColor || theme.colors.onSurface}
          />
        )}
      </View>
      <View style={styles.content}>
        <Text variant='caption' size='sm'>{label}</Text>
        {value && <Text variant='body'>{value}</Text>}
      </View>
      {action}
      {editable && (
        <Button
          icon='edit'
          variant='secondary'
          size='sm'
          onPress={handleOnEdit}
        />
      )}
    </Field>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  fieldContainer: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
})

export default Item


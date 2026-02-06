import { setOverlay } from '@app/shared/overlay'
import { Theme, useThemeStore } from '@app/shared/theme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import Button from '../button/Button'
import Field from '../field/Field'
import Icon, { IconName } from '../icon/Icon'
import Text from '../text/Text'
import { ComponentSize, ComponentVariant } from '../types'
import { ItemTextEditor } from './ItemTextEditor'

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
  onSubmitEdit?: (newValue: any) => Promise<void>
}

const Item = ({
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
  onSubmitEdit = async (value: any) => { },
  type = 'text',
}: ItemProps) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  const handleOnEdit = () => {
    if (!editable) return
    if (onEdit) {
      onEdit()
    } else {
      const close = setOverlay('edit-item',
        <ItemTextEditor value={value || ''} multiline={type === 'multiline'} onSubmit={async (newValue) => {
          onSubmitEdit(newValue)
          close()
        }} />, {
        title: 'Edit...',
        variant: 'compact'
      })
    }
  }

  return (
    <Field style={{ flexDirection: 'row' }}>
      <View style={styles.iconContainer}>
        {icon && <Icon
          name={icon}
          size={iconSize}
          color={iconColor || theme.colors.onSurface}
        />}
      </View>
      <View style={styles.content}>
        <Text variant='caption' size='sm'>{label}</Text>
        {value && <Text variant='body'>{value}</Text>}
      </View>
      {action}
      {editable && <Button icon='edit' variant='secondary' size='sm' onPress={handleOnEdit} />}
    </Field>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
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


import { Theme, useThemeStore } from '@app/shared/theme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import Button from '../button/Button'
import Icon, { IconSymbolName } from '../icon/Icon'
import Text from '../text/Text'

interface InfoFieldProps {
  icon: IconSymbolName
  label: string
  value?: string | null
  iconColor?: string
  iconSize?: number
  action?: React.ReactNode
  onEdit?: () => void
}

const InfoField: React.FC<InfoFieldProps> = ({
  icon,
  label,
  value,
  iconColor,
  iconSize = 20,
  action,
  onEdit
}) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon
          name={icon}
          size='md'
          color={iconColor || theme.colors.onSurface}
        />
      </View>
      <View style={styles.content}>
        <Text variant='caption' size='sm'>{label}</Text>
        {value && <Text variant='body'>{value}</Text>}
      </View>
      {action}
      {onEdit && <Button icon='edit' variant='secondary' size='sm' onPress={onEdit} />}
    </View>
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

export default InfoField

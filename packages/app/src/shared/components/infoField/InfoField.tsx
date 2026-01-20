import { Theme, useThemeStore } from '@app/shared/theme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import Icon, { IconSymbolName } from '../icon/Icon'
import Text from '../text/Text'

interface InfoFieldProps {
  icon: IconSymbolName
  label: string
  value?: string | null
  iconColor?: string
  iconSize?: number
}

const InfoField: React.FC<InfoFieldProps> = ({ 
  icon, 
  label, 
  value, 
  iconColor, 
  iconSize = 20 
}) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon 
          name={icon} 
          size={iconSize} 
          color={iconColor || theme.colors.onSurface} 
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {value && <Text style={styles.value}>{value}</Text>}
      </View>
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
    gap: 4,
  },
  label: {
    ...theme.text.size.xs,
    color: theme.colors.onSurface,
    opacity: 0.6,
  },
  value: {
    ...theme.text.size.sm,
    color: theme.colors.onSurface,
  },
})

export default InfoField

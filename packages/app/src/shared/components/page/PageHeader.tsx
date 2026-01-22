import { Theme, useThemeStore } from '@app/shared/theme'
import { StyleSheet, View } from 'react-native'
import { IconButton } from '../button/Button'
import { FertheLabel } from '../ferthe/Logo'
import Text from '../text/Text'
import { Option } from '../types'

interface PageHeaderProps {
  label?: string
  options?: Option[]
  action?: React.ReactNode
}

const PageHeader = ({ label, action, options }: PageHeaderProps) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const showOptions = options && options.length > 0
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}></View>
      <View style={styles.labelContainer}>
        {label ? (
          <Text style={styles.label}>{label}</Text>
        ) : (
          <FertheLabel style={styles.logo} fill={theme.colors.onBackground} />
        )}
      </View>
      <View style={styles.rightContainer}>{action && action}
        {showOptions && <IconButton variant='outlined' options={options} name={'more-vert'} style={styles.iconButton} />}
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      width: '100%',
      height: theme.dimensions.HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    logo: {
      height: 24,
    },
    label: {
      ...theme.typo.heading,
      textAlign: 'center',
    },
    leftContainer: {
      padding: 8,
      width: 60,
    },
    labelContainer: {
      marginTop: 5,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rightContainer: {
      padding: 8,
      width: 60,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    iconButton: {
      marginRight: 8,
    },
  })

export { PageHeader }
export default PageHeader

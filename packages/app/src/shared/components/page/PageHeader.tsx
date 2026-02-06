import { Theme, useThemeStore } from '@app/shared/theme'
import { StyleSheet, View } from 'react-native'
import Button from '../button/Button'
import { FertheLabel } from '../ferthe/Logo'
import Text from '../text/Text'
import { Option } from '../types'

interface PageHeaderProps {
  leading?: React.ReactNode
  title?: string
  options?: Option[]
  trailing?: React.ReactNode
}

const PageHeader = ({ leading, title = "", trailing, options }: PageHeaderProps) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const showOptions = options && options.length > 0
  return (
    <View style={styles.header}>
      <View style={styles.leading}>{leading}</View>
      <View style={styles.label}>
        {title ? (
          <Text style={styles.label}>{title}</Text>
        ) : (
          <FertheLabel style={styles.logo} fill={theme.colors.onBackground} />
        )}
      </View>
      <View style={styles.trailing}>{trailing}
        {showOptions && <Button variant='outlined' options={options} icon='more-vert' />}
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
    leading: {
      padding: 8,
      width: 60,
    },
    trailing: {
      padding: 8,
      width: 60,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
  })

export { PageHeader }
export default PageHeader

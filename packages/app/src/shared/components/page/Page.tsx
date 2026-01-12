import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { StyleProp, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Option } from '../types'
import { PageHeader } from './PageHeader'

const CONTAINER_PADDING = 16

interface PageProps {
  children?: React.ReactNode
  label?: string
  style?: StyleProp<ViewStyle>
  options?: Option[]
  scrollable?: boolean
}

/**
 * Page wrapper component that provides consistent layout structure
 * with optional header, scrollable content, and safe area handling.
 */
function Page({ children, label, style, options, scrollable = false }: PageProps) {
  const { styles } = useApp(useStyles)

  if (!styles) return null

  // Dynamic content container based on scrollable prop
  const ContentContainer = scrollable ? ScrollView : View
  const contentProps = scrollable ? { contentContainerStyle: { flexGrow: 1 } } : {}

  return (
    <SafeAreaView style={[styles.page, style]} edges={['top']}>
      {/* Page header with optional label and actions */}
      <PageHeader label={label} options={options} />

      {/* Main content area */}
      <ContentContainer style={styles.container} {...contentProps}>
        {children}
      </ContentContainer>
    </SafeAreaView>
  )
}

const useStyles = createThemedStyles(theme => ({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: CONTAINER_PADDING,
    flex: 1,
    flexGrow: 1,
    backgroundColor: theme.colors.background,
  },
}))

export default Page

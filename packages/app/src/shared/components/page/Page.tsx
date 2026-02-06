import { useTheme } from '@app/shared/theme'
import { StyleProp, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Inset, Option } from '../types'
import { PageHeader } from './PageHeader'

interface PageProps {
  children?: React.ReactNode
  label?: string
  style?: StyleProp<ViewStyle>
  options?: Option[]
  action?: React.ReactNode
  scrollable?: boolean
  inset?: Inset
}

/**
 * Page wrapper component that provides consistent layout structure
 * with optional header, scrollable content, and safe area handling.
 * Supports configurable horizontal inset for content padding.
 */
function Page(props: PageProps) {
  const { children, label, style, options, scrollable = false, action, inset = 'md' } = props
  const { styles, theme } = useTheme(createStyles)
  const insets = useSafeAreaInsets()

  const insetValue = theme.tokens.inset[inset]

  // Dynamic content container based on scrollable prop
  const ContentContainer = scrollable ? ScrollView : View
  const contentProps = scrollable
    ? { contentContainerStyle: [{ flexGrow: 1, paddingHorizontal: insetValue }] }
    : {}

  return (
    <View style={[styles.page, style, { paddingTop: insets.top }]}>
      <PageHeader label={label} options={options} action={action} />

      <ContentContainer style={[styles.container, !scrollable && { paddingHorizontal: insetValue }]} {...contentProps}>
        {children}
      </ContentContainer>
    </View>
  )
}

const createStyles = (theme: any) => ({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
})

export default Page

import { Theme, useTheme } from '@app/shared/theme'
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Button from '../button/Button'
import { Inset, Option } from '../types'
import { PageHeader } from './PageHeader'

interface PageProps {
  children?: React.ReactNode
  title?: string
  style?: StyleProp<ViewStyle>
  options?: Option[]
  trailing?: React.ReactNode
  leading?: React.ReactNode
  scrollable?: boolean
  inset?: Inset
  loading?: boolean
  onBack?: () => void
}

/**
 * Page wrapper component that provides consistent layout structure
 * with optional header, scrollable content, and safe area handling.
 * Supports configurable horizontal inset for content padding.
 * Shows loading indicator when loading=true.
 */
function Page(props: PageProps) {
  const { children, title, style, options, scrollable = false, trailing, leading, inset = 'md', loading = false, onBack } = props
  const { styles, theme } = useTheme(createStyles)
  const insets = useSafeAreaInsets()

  const resolvedLeading = leading ?? (onBack ? <Button icon='arrow-back' onPress={onBack} /> : undefined)

  const insetValue = theme.tokens.inset[inset]

  // Dynamic content container based on scrollable prop
  const ContentContainer = scrollable ? ScrollView : View
  const contentProps = scrollable
    ? { contentContainerStyle: [{ flexGrow: 1 }] }
    : {}

  return (
    <View style={[styles.page, { paddingTop: insets.top, paddingBottom: inset !== 'none' ? insets.bottom : 0 }, style]}>
      <PageHeader title={title} options={options} trailing={trailing} leading={resolvedLeading} />

      <ContentContainer style={[styles.container, { paddingHorizontal: insetValue }]} {...contentProps}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          children
        )}
      </ContentContainer>
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })

export default Page

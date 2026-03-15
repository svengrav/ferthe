import { Theme, useTheme } from '@app/shared/theme'
import { ActivityIndicator, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, RefreshControl, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Button from '../button/Button'
import { Inset, Option } from '../types'
import { PageHeader } from './PageHeader'

const END_REACHED_THRESHOLD = 200

export interface PageProps {
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
  keyboardAware?: boolean
  onRefresh?: () => void
  refreshing?: boolean
  onEndReached?: () => void
  /** Apply bottom safe-area inset. Use in overlays that live outside the Navigator. */
  screen?: boolean
}

/**
 * Page wrapper component that provides consistent layout structure
 * with optional header, scrollable content, and safe area handling.
 * Supports configurable horizontal inset for content padding.
 * Shows loading indicator when loading=true.
 */
function Page(props: PageProps) {
  const { children, title, style, options, scrollable = false, trailing, leading, inset = 'md', loading = false, onBack, keyboardAware = false, onRefresh, refreshing = false, onEndReached, screen = false } = props
  const { styles, theme } = useTheme(createStyles)
  const insets = useSafeAreaInsets()

  const resolvedLeading = leading ?? (onBack ? <Button icon='arrow-back' onPress={onBack} /> : undefined)

  const insetValue = theme.tokens.inset[inset]

  const handleScroll = onEndReached
    ? (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - END_REACHED_THRESHOLD) {
        onEndReached()
      }
    }
    : undefined

  const bottomPadding = !screen && inset !== 'none' ? insets.bottom : 0

  const renderScrollableContent = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: insetValue, paddingBottom: bottomPadding }}
      {...(onRefresh ? { refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> } : {})}
      {...(handleScroll ? { onScroll: handleScroll, scrollEventThrottle: 400 } : {})}
    >
      {loading ? <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View> : children}
    </ScrollView>
  )

  const renderStaticContent = () => (
    <View style={[styles.container, { paddingHorizontal: insetValue, paddingBottom: bottomPadding }]}>
      {loading ? <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View> : children}
    </View>
  )

  const page = (
    <View style={[styles.page, { paddingTop: insets.top }, style]}>
      <PageHeader title={title} options={options} trailing={trailing} leading={resolvedLeading} />
      {scrollable ? renderScrollableContent() : renderStaticContent()}
    </View>
  )

  if (keyboardAware) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {page}
      </KeyboardAvoidingView>
    )
  }

  return page
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })

export default Page

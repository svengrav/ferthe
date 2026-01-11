import { Theme, useThemeStore } from '@app/shared/theme'
import React, { forwardRef } from 'react'
import Native, { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface CardProps extends Native.ViewProps {
  children?: React.ReactNode
}

const Card = forwardRef<View, CardProps>(({ children, style, ...props }, ref) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <SafeAreaView ref={ref} style={[styles.container, style]} edges={['top']} {...props}>
      {children}
    </SafeAreaView>
  )
})

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      padding: 8,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onBackground,
      borderRadius: 8,
    },
  })

export default Card

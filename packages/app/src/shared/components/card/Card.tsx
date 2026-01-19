import { Theme, useThemeStore } from '@app/shared/theme'
import React, { forwardRef } from 'react'
import Native, { StyleSheet, View } from 'react-native'

interface CardProps extends Native.ViewProps {
  children?: React.ReactNode
}

const Card = forwardRef<View, CardProps>(({ children, style, ...props }, ref) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <View ref={ref} style={[styles.container, style]}  {...props}>
      {children}
    </View>
  )
})

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      padding: 6,
    },
  })

export default Card

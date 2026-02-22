import { Theme, ThemedConfig, VariantOf, themedVariants, useThemeStore, useVariants } from "@app/shared/theme";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Text from "../text/Text";

const sizeConfig = {
  variants: {
    size: {
      sm: (t: any) => ({ paddingVertical: t.tokens.spacing.sm }),
      md: (t: any) => ({ paddingVertical: t.tokens.spacing.md }),
      lg: (t: any) => ({ paddingVertical: t.tokens.spacing.lg }),
    },
  },
  defaultVariants: { size: 'md' as const },
} satisfies ThemedConfig<ViewStyle>

const sizeVariants = themedVariants<ViewStyle>(sizeConfig)
type DividerSize = VariantOf<typeof sizeConfig, 'size'>

interface DividerProps {
  text?: string
  size?: DividerSize
  style?: StyleProp<ViewStyle>
}

export default function Divider({ text, size = 'md', style }: DividerProps) {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const sizeStyle = useVariants(sizeVariants, { size })

  return (
    <View style={[styles.divider, sizeStyle, style]} id="divider">
      <View style={styles.dividerLine} />
      {text && <Text style={styles.dividerText}>{text}</Text>}
      <View style={styles.dividerLine} />
    </View>
  )
}

const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    divider: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.onSurface + '20',
    },
    dividerText: {
      marginHorizontal: theme.tokens.spacing.md,
      color: theme.colors.onSurface + '80',
    },
  })
}

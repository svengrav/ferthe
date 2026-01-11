import { Theme, useThemeStore } from "@app/shared/theme";
import { StyleSheet, View } from "react-native";
import Text from "../text/Text";

export default function Divider({ text }: { text?: string }) {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  )
}

const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
    },
    card: {
      padding: 24,
    },
    title: {
      ...theme.text.size.lg,
      fontFamily: theme.text.primary.semiBold,
      textAlign: 'center',
      marginBottom: 32,
      color: theme.colors.onSurface,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      ...theme.text.size.md,
      fontFamily: theme.text.primary.semiBold,
      marginBottom: 16,
      color: theme.colors.onSurface,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.onSurface + '30',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surface,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.onSurface + '20',
    },
    dividerText: {
      ...theme.text.size.sm,
      marginHorizontal: 16,
      color: theme.colors.onSurface + '80',
    },
    notice: {
      ...theme.text.size.xs,
      textAlign: 'center',
      marginTop: 8,
      color: theme.colors.onSurface + '80',
      lineHeight: 18,
    },
  })
}

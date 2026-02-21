import Text from '@app/shared/components/text/Text'
import { Theme, useTheme } from '@app/shared/theme'
import { LinkBlockData } from '@shared/contracts'
import { Linking, StyleSheet, TouchableOpacity } from 'react-native'

interface LinkBlockRendererProps {
  data: LinkBlockData
}

function LinkBlockRenderer(props: LinkBlockRendererProps) {
  const { data } = props
  const { styles } = useTheme(createStyles)

  const handlePress = () => {
    Linking.openURL(data.url)
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Text variant="body" style={styles.linkText}>
        {data.label || data.url}
      </Text>
    </TouchableOpacity>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingVertical: theme.tokens.spacing.xs,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
})

export default LinkBlockRenderer

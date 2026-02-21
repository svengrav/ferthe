import Text from '@app/shared/components/text/Text'
import { Theme, useTheme } from '@app/shared/theme'
import { QuoteBlockData } from '@shared/contracts'
import { StyleSheet, View } from 'react-native'

interface QuoteBlockRendererProps {
  data: QuoteBlockData
}

function QuoteBlockRenderer(props: QuoteBlockRendererProps) {
  const { data } = props
  const { styles } = useTheme(createStyles)

  return (
    <View style={styles.container}>
      <Text variant="body" style={styles.quoteText}>"{data.text}"</Text>
      {data.author && <Text variant="caption">— {data.author}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.tokens.spacing.md,
    paddingVertical: theme.tokens.spacing.sm,
  },
  quoteText: {
    fontStyle: 'italic',
  },
})

export default QuoteBlockRenderer

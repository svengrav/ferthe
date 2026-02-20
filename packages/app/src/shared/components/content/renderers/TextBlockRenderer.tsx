import { Text } from '@app/shared/components'
import { TextBlockData } from '@shared/contracts'

interface TextBlockRendererProps {
  data: TextBlockData
}

function TextBlockRenderer(props: TextBlockRendererProps) {
  const { data } = props
  return <Text variant="body">{data.text}</Text>
}

export default TextBlockRenderer

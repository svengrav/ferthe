import { Stack, Text } from '@app/shared/components'
import { ContentBlock } from '@shared/contracts'

import ImageBlockRenderer from './renderers/ImageBlockRenderer'
import LinkBlockRenderer from './renderers/LinkBlockRenderer'
import QuoteBlockRenderer from './renderers/QuoteBlockRenderer'
import TextBlockRenderer from './renderers/TextBlockRenderer'

interface ContentBlockListProps {
  blocks: ContentBlock[]
}

/**
 * Renders an ordered list of content blocks.
 * Delegates to type-specific renderers.
 */
function ContentBlockList(props: ContentBlockListProps) {
  const { blocks } = props

  const sorted = [...blocks].sort((a, b) => a.order - b.order)

  if (sorted.length === 0) return null

  return (
    <Stack spacing="md">
      {sorted.map(block => (
        <ContentBlockItem key={block.id} block={block} />
      ))}
    </Stack>
  )
}

function ContentBlockItem({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer data={block.data} />
    case 'quote':
      return <QuoteBlockRenderer data={block.data} />
    case 'image':
      return <ImageBlockRenderer data={block.data} />
    case 'link':
      return <LinkBlockRenderer data={block.data} />
    default:
      return <Text variant="caption">Unknown block type</Text>
  }
}

export default ContentBlockList

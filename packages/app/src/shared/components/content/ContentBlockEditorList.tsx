import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { ContentBlock, ContentBlockType } from '@shared/contracts'

import DraggableList from '../draggable/DraggableList'
import ImageBlockEditor from './editors/ImageBlockEditor'
import LinkBlockEditor from './editors/LinkBlockEditor'
import QuoteBlockEditor from './editors/QuoteBlockEditor'
import TextBlockEditor from './editors/TextBlockEditor'

interface ContentBlockEditorListProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}

const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Editor for a list of content blocks.
 * Supports drag-and-drop reorder, add, remove, and edit operations.
 */
function ContentBlockEditorList(props: ContentBlockEditorListProps) {
  const { blocks, onChange } = props
  const { locales } = useApp()
  const { styles, theme } = useTheme(createStyles)

  const sorted = [...blocks].sort((a, b) => a.order - b.order)

  const updateBlock = (id: string, updated: ContentBlock) => {
    onChange(blocks.map(b => b.id === id ? updated : b))
  }

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id))
  }

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    // Reassign order values based on new positions
    onChange(reordered.map((block, i) => ({ ...block, order: i })))
  }, [sorted, onChange])

  const addBlock = (type: ContentBlockType) => {
    const maxOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.order)) : -1
    const newBlock = createEmptyBlock(type, maxOrder + 1)
    onChange([...blocks, newBlock])
  }

  const renderBlock = useCallback((block: ContentBlock, index: number) => (
    <View style={styles.blockWrapper}>
      <View style={styles.blockActions}>
        <Button
          icon="close"
          variant="outlined"
          size="sm"
          onPress={() => removeBlock(block.id)}
        />
      </View>
      <BlockEditor block={block} onChange={(updated) => updateBlock(block.id, updated)} />
    </View>
  ), [styles, locales])

  return (
    <View style={styles.root}>
      <DraggableList
        data={sorted}
        keyExtractor={(block) => block.id}
        renderItem={renderBlock}
        onReorder={handleReorder}
        gap={theme.tokens.spacing.md}
      />

      {/* Centered add block button with dropdown */}
      <Button
        icon="add"
        variant="primary"
        size="md"
        style={styles.addButton}
        options={[
          { label: locales.contentBlocks.addText, onPress: () => addBlock('text') },
          { label: locales.contentBlocks.addQuote, onPress: () => addBlock('quote') },
          { label: locales.contentBlocks.addImage, onPress: () => addBlock('image') },
          { label: locales.contentBlocks.addLink, onPress: () => addBlock('link') },
        ]}
      />
    </View>
  )
}

// --- Block editor dispatch ---

function BlockEditor({ block, onChange }: { block: ContentBlock, onChange: (block: ContentBlock) => void }) {
  switch (block.type) {
    case 'text':
      return <TextBlockEditor block={block} onChange={onChange} />
    case 'quote':
      return <QuoteBlockEditor block={block} onChange={onChange} />
    case 'image':
      return <ImageBlockEditor block={block} onChange={onChange} />
    case 'link':
      return <LinkBlockEditor block={block} onChange={onChange} />
  }
}

// --- Factory ---

function createEmptyBlock(type: ContentBlockType, order: number): ContentBlock {
  const id = generateBlockId()

  switch (type) {
    case 'text':
      return { id, type, data: { text: '' }, order }
    case 'quote':
      return { id, type, data: { text: '', author: '' }, order }
    case 'image':
      return { id, type, data: { imageUrl: '' }, order }
    case 'link':
      return { id, type, data: { url: '', label: '' }, order }
  }
}

const createStyles = (theme: Theme) => StyleSheet.create({
  root: {
    gap: theme.tokens.spacing.md,
    paddingVertical: theme.tokens.spacing.lg
  },
  blockWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.onSurface + '20',
    borderRadius: theme.tokens.borderRadius.md,
    padding: theme.tokens.spacing.sm,
    gap: theme.tokens.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  blockActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.tokens.spacing.xs,
  },
  addButtonContainer: {

    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
})

export default ContentBlockEditorList

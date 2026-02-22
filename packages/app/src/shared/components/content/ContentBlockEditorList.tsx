import { useCallback } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'

import Button from '@app/shared/components/button/Button'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import { OrderedListContext, useOrderedList } from '@app/shared/hooks/useOrderedList'
import { Theme, useTheme } from '@app/shared/theme'
import { ContentBlock, ContentBlockType } from '@shared/contracts'

import { useLocalization } from '@app/shared/localization'
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
 * Uses useOrderedList for state management and provides context for child access.
 * Supports drag-and-drop reorder, add, and remove operations.
 */
function ContentBlockEditorList(props: ContentBlockEditorListProps) {
  const { blocks, onChange } = props
  const { locales } = useLocalization()
  const { styles, theme } = useTheme(createStyles)
  const list = useOrderedList(blocks, onChange)
  const { openDialog } = useRemoveDialog()

  const addBlock = (type: ContentBlockType) => {
    const maxOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.order)) : -1
    list.add(createEmptyBlock(type, maxOrder + 1))
  }

  const renderBlock = useCallback((block: ContentBlock) => (
    <View style={styles.blockWrapper}>
      <BlockEditor block={block} onChange={(updated) => list.update(block.id, updated)} />
    </View>
  ), [styles, list])

  const renderActions = (block: ContentBlock) => (
    <Button
      icon="close"
      variant="outlined"
      size="sm"
      onPress={() => openDialog({ onConfirm: () => list.remove(block.id) })}
    />
  )

  return (
    <OrderedListContext.Provider value={list}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.root}>
          <DraggableList
            data={list.items}
            keyExtractor={(block) => block.id}
            renderItem={renderBlock}
            renderActions={renderActions}
            onReorder={list.reorder}
            gap={theme.tokens.spacing.md}
          />

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
      </KeyboardAvoidingView>
    </OrderedListContext.Provider>
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

  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
})

export default ContentBlockEditorList

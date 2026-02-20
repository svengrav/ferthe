import { ContentBlock } from '@shared/contracts'
import { z } from 'zod'

// --- Types ---

export interface SpotContentFormValues {
  name: string
  description: string
  imageBase64?: string
  contentBlocks: ContentBlock[]
}

export interface SpotOptionsFormValues {
  visibility: 'preview' | 'hidden'
  trailIds: string[]
}

// --- Content block validation ---

/** Check if a content block has empty/missing required data. */
function isContentBlockEmpty(block: ContentBlock): boolean {
  switch (block.type) {
    case 'text': return !block.data.text.trim()
    case 'quote': return !block.data.text.trim()
    case 'image': return !block.data.imageUrl
    case 'link': return !block.data.url.trim()
  }
}

// --- Schema factories (localized error messages) ---

interface ValidationMessages {
  nameMinLength: string
  contentBlockEmpty: string
}

/** Create zod schema for spot content step (name, description, image, content blocks). */
export function createSpotContentSchema(messages: ValidationMessages) {
  return z.object({
    name: z.string().min(2, messages.nameMinLength),
    description: z.string(),
    imageBase64: z.string().optional(),
    contentBlocks: z.array(z.any()).refine(
      (blocks: ContentBlock[]) => blocks.every(block => !isContentBlockEmpty(block)),
      messages.contentBlockEmpty,
    ),
  })
}

/** Create zod schema for spot options step (visibility, trail assignment). */
export function createSpotOptionsSchema() {
  return z.object({
    visibility: z.enum(['preview', 'hidden']),
    trailIds: z.array(z.string()),
  })
}

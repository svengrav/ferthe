/**
 * Generic content block system.
 * Reusable across features (Spots, Trails, Communities, etc.).
 *
 * Blocks are ordered by `order` field and rendered sequentially.
 * Each block has a discriminated `type` + typed `data` payload.
 */

// --- Block data types ---

export interface TextBlockData {
  text: string
}

export interface QuoteBlockData {
  text: string
  author?: string
}

export interface ImageBlockData {
  /** Image URL (stored) or base64 data URI (upload) */
  imageUrl: string
  caption?: string
}

export interface LinkBlockData {
  url: string
  label?: string
}

// --- Block type map (discriminated union) ---

export type ContentBlockType = 'text' | 'quote' | 'image' | 'link'

export interface TextBlock {
  id: string
  type: 'text'
  data: TextBlockData
  order: number
}

export interface QuoteBlock {
  id: string
  type: 'quote'
  data: QuoteBlockData
  order: number
}

export interface ImageBlock {
  id: string
  type: 'image'
  data: ImageBlockData
  order: number
}

export interface LinkBlock {
  id: string
  type: 'link'
  data: LinkBlockData
  order: number
}

export type ContentBlock = TextBlock | QuoteBlock | ImageBlock | LinkBlock

/**
 * Generic content block system.
 * Reusable across features (Spots, Trails, Communities, etc.).
 *
 * Blocks are ordered by `order` field and rendered sequentially.
 * Each block has a discriminated `type` + typed `data` payload.
 */

import { z } from 'zod'
import { guard } from './strings.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────────────────────

export const TextBlockDataSchema = z.object({
  text: guard.blockText,
})

export const QuoteBlockDataSchema = z.object({
  text: guard.blockText,
  author: guard.blockTextOptional,
})

export const ImageBlockDataSchema = z.object({
  imageUrl: z.string().url(), // Image URL (stored) or base64 data URI (upload)
  caption: guard.blockTextOptional,
})

export const LinkBlockDataSchema = z.object({
  url: z.string().url(),
  label: guard.blockTextOptional,
})

export const ContentBlockTypeSchema = z.enum(['text', 'quote', 'image', 'link'])

export const TextBlockSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  data: TextBlockDataSchema,
  order: z.number().int().min(0).max(1000),
})

export const QuoteBlockSchema = z.object({
  id: z.string(),
  type: z.literal('quote'),
  data: QuoteBlockDataSchema,
  order: z.number().int().min(0).max(1000),
})

export const ImageBlockSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  data: ImageBlockDataSchema,
  order: z.number().int().min(0).max(1000),
})

export const LinkBlockSchema = z.object({
  id: z.string(),
  type: z.literal('link'),
  data: LinkBlockDataSchema,
  order: z.number().int().min(0).max(1000),
})

export const ContentBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  QuoteBlockSchema,
  ImageBlockSchema,
  LinkBlockSchema,
])

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod)
// ──────────────────────────────────────────────────────────────

export type TextBlockData = z.infer<typeof TextBlockDataSchema>
export type QuoteBlockData = z.infer<typeof QuoteBlockDataSchema>
export type ImageBlockData = z.infer<typeof ImageBlockDataSchema>
export type LinkBlockData = z.infer<typeof LinkBlockDataSchema>
export type ContentBlockType = z.infer<typeof ContentBlockTypeSchema>
export type TextBlock = z.infer<typeof TextBlockSchema>
export type QuoteBlock = z.infer<typeof QuoteBlockSchema>
export type ImageBlock = z.infer<typeof ImageBlockSchema>
export type LinkBlock = z.infer<typeof LinkBlockSchema>
export type ContentBlock = z.infer<typeof ContentBlockSchema>

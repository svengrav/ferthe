/**
 * Generic content block system.
 * Reusable across features (Spots, Trails, Communities, etc.).
 *
 * Blocks are ordered by `order` field and rendered sequentially.
 * Each block has a discriminated `type` + typed `data` payload.
 */

import { z } from 'zod'

// ──────────────────────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────────────────────

export const TextBlockDataSchema = z.object({
  text: z.string(),
})

export const QuoteBlockDataSchema = z.object({
  text: z.string(),
  author: z.string().optional(),
})

export const ImageBlockDataSchema = z.object({
  imageUrl: z.string(), // Image URL (stored) or base64 data URI (upload)
  caption: z.string().optional(),
})

export const LinkBlockDataSchema = z.object({
  url: z.string().url(),
  label: z.string().optional(),
})

export const ContentBlockTypeSchema = z.enum(['text', 'quote', 'image', 'link'])

export const TextBlockSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  data: TextBlockDataSchema,
  order: z.number().int(),
})

export const QuoteBlockSchema = z.object({
  id: z.string(),
  type: z.literal('quote'),
  data: QuoteBlockDataSchema,
  order: z.number().int(),
})

export const ImageBlockSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  data: ImageBlockDataSchema,
  order: z.number().int(),
})

export const LinkBlockSchema = z.object({
  id: z.string(),
  type: z.literal('link'),
  data: LinkBlockDataSchema,
  order: z.number().int(),
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

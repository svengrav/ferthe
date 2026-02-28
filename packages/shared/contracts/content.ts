/**
 * Content & Blog contracts
 * Covers language-aware static pages, blog posts and feedback.
 */

import { z } from 'zod'
import { guard } from './strings.ts'

export const LanguageSchema = z.enum(['en', 'de'])

// ── Content Page ─────────────────────────────────────────────

export const ContentPageSchema = z.object({
  page: guard.shortText,
  title: guard.shortText,
  date: z.string(),
  language: LanguageSchema,
  author: guard.shortTextOptional,
  tags: z.array(guard.shortText).max(10).optional(),
  summary: guard.mediumTextOptional,
  heroImage: z.string().url().optional(),
  content: guard.longText,
})

export type ContentPage = z.infer<typeof ContentPageSchema>

// ── Blog ─────────────────────────────────────────────────────

export const BlogPostSchema = z.object({
  slug: z.string(),
  title: guard.shortText,
  date: z.string(),
  language: LanguageSchema,
  author: guard.shortTextOptional,
  tags: z.array(guard.shortText).max(10).optional(),
  heroImage: z.string().url().optional(),
  preview: guard.mediumTextOptional,
  content: guard.longText,
})

export type BlogPost = z.infer<typeof BlogPostSchema>

// ── Feedback ─────────────────────────────────────────────────

export const FeedbackRequestSchema = z.object({
  message: guard.mediumText.min(1),
  name: guard.shortTextOptional,
  email: z.string().email().optional(),
  type: z.enum(['bug', 'feature', 'general', 'other']).optional(),
})

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>

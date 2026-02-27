/**
 * Content & Blog contracts
 * Covers language-aware static pages, blog posts and feedback.
 */

import { z } from 'zod'

export const LanguageSchema = z.enum(['en', 'de'])

// ── Content Page ─────────────────────────────────────────────

export const ContentPageSchema = z.object({
  page: z.string(),
  title: z.string(),
  date: z.string(),
  language: LanguageSchema,
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  heroImage: z.string().optional(),
  content: z.string(),
})

export type ContentPage = z.infer<typeof ContentPageSchema>

// ── Blog ─────────────────────────────────────────────────────

export const BlogPostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  language: LanguageSchema,
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  heroImage: z.string().optional(),
  preview: z.string().optional(),
  content: z.string(),
})

export type BlogPost = z.infer<typeof BlogPostSchema>

// ── Feedback ─────────────────────────────────────────────────

export const FeedbackRequestSchema = z.object({
  message: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  type: z.enum(['bug', 'feature', 'general', 'other']).optional(),
})

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>

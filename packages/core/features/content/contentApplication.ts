/**
 * Content Application — file I/O for markdown content.
 * Reads from contentDir, delegates parsing to contentService, returns Result<T>.
 */

import { logger } from '@core/shared/logger.ts'
import type { BlogPost, ContentPage } from '@shared/contracts/content.ts'
import type { Result } from '@shared/contracts/results.ts'
import { join, resolve } from 'node:path'
import { parseMarkdown, sortByDateDesc, toBlogPost, toContentPage } from './contentService.ts'

// ── Interface ─────────────────────────────────────────────────────────────────

export interface ContentApplicationActions {
  getPage(language: string, page: string): Promise<Result<ContentPage>>
  listBlogPosts(language: string): Promise<Result<BlogPost[]>>
  getBlogPost(language: string, slug: string): Promise<Result<BlogPost>>
  submitFeedback(
    name: string | undefined,
    email: string | undefined,
    type: string | undefined,
    message: string | undefined,
  ): Promise<Result<{ received: true }>>
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createContentApplication(contentDir: string): ContentApplicationActions {
  return {
    async getPage(language, page) {
      const dir = resolve(contentDir, language)
      const filePath = resolve(dir, `${page}.md`)

      // Path traversal guard
      if (!filePath.startsWith(dir)) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } }
      }

      try {
        const raw = await Deno.readTextFile(filePath)
        const { metadata, content } = parseMarkdown(raw)
        return { success: true, data: toContentPage(page, language, metadata, content) }
      } catch {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Content not found' } }
      }
    },

    async listBlogPosts(language) {
      const blogDir = resolve(contentDir, 'blog')
      const posts: BlogPost[] = []

      try {
        for await (const entry of Deno.readDir(blogDir)) {
          if (!entry.isFile || !entry.name.endsWith('.md')) continue
          try {
            const raw = await Deno.readTextFile(join(blogDir, entry.name))
            const { metadata, content } = parseMarkdown(raw)
            if (metadata.language !== language) continue
            const slug = entry.name.replace('.md', '')
            posts.push(toBlogPost(slug, metadata, content))
          } catch {
            // Skip unreadable files
          }
        }
        return { success: true, data: sortByDateDesc(posts) }
      } catch {
        return { success: true, data: [] }
      }
    },

    async getBlogPost(language, slug) {
      const filePath = resolve(contentDir, 'blog', `${slug}.md`)

      try {
        const raw = await Deno.readTextFile(filePath)
        const { metadata, content } = parseMarkdown(raw)

        if (metadata.language !== language) {
          return { success: false, error: { code: 'NOT_FOUND', message: 'Blog post not found for this language' } }
        }

        return {
          success: true,
          data: {
            slug,
            title: metadata.title ?? 'Untitled',
            date: metadata.date ?? '',
            language: metadata.language as BlogPost['language'],
            author: metadata.author,
            tags: metadata.tags ?? [],
            heroImage: metadata.heroImage,
            content,
          },
        }
      } catch {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Blog post not found' } }
      }
    },

    async submitFeedback(name, email, type, message) {
      if (!message?.trim()) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Message is required' } }
      }

      const feedback = {
        timestamp: new Date().toISOString(),
        name: name ?? 'Anonymous',
        email: email ?? 'Not provided',
        type: type ?? 'other',
        message: message.trim(),
      }

      logger.info('Feedback received', feedback)

      try {
        const feedbackLog = `${Deno.cwd()}/feedback.jsonl`
        await Deno.writeTextFile(feedbackLog, JSON.stringify(feedback) + '\n', { append: true })
      } catch { /* non-critical */ }

      return { success: true, data: { received: true as const } }
    },
  }
}

/**
 * Content Service — pure functions for parsing markdown and building domain objects.
 * No I/O, no side effects.
 */

import type { BlogPost, ContentPage } from '@shared/contracts/content.ts'
import matter from 'gray-matter'

// ── Markdown ──────────────────────────────────────────────────────────────────

export interface ParsedMarkdown {
  metadata: Record<string, any>
  content: string
}

export function parseMarkdown(raw: string): ParsedMarkdown {
  const { data, content } = matter(raw)
  return { metadata: data ?? {}, content: content.trim() }
}

export function buildPreview(content: string, maxLength = 300): string {
  const stripped = content.replace(/\n/g, ' ').trim()
  return stripped.length > maxLength ? stripped.slice(0, maxLength) + '...' : stripped
}

// ── Domain builders ───────────────────────────────────────────────────────────

export function toContentPage(
  page: string,
  language: string,
  metadata: Record<string, any>,
  content: string,
): ContentPage {
  return {
    page,
    title: metadata.title ?? 'Untitled',
    date: metadata.date ?? '',
    language: (metadata.language ?? language) as ContentPage['language'],
    author: metadata.author,
    tags: metadata.tags ?? [],
    summary: metadata.summary,
    heroImage: metadata.heroImage,
    content,
  }
}

export function toBlogPost(slug: string, metadata: Record<string, any>, content: string): BlogPost {
  return {
    slug,
    title: metadata.title ?? 'Untitled',
    date: metadata.date ?? '',
    language: metadata.language as BlogPost['language'],
    author: metadata.author,
    tags: metadata.tags ?? [],
    heroImage: metadata.heroImage,
    preview: buildPreview(content),
    content,
  }
}

export function sortByDateDesc(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

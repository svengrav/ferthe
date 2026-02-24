import { useLocalization } from '@app/shared/localization'
import { logger } from '@app/shared/utils/logger'
import { useEffect, useState } from 'react'

export interface BlogPost {
  slug: string
  url: string
  title: string
  date: string
  language: string
  author: string
  tags: string[]
  heroImage?: string
  preview: string
}

interface UseBlogPostsResult {
  posts: BlogPost[]
  loading: boolean
  error: string | null
}

/**
 * Fetches blog posts from the ferthe.de API based on the current app language.
 */
export function useBlogPosts(): UseBlogPostsResult {
  const { language } = useLocalization()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`https://ferthe.de/api/de/blog/`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (!cancelled) setPosts(data.posts ?? [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load blog posts'
        logger.error('useBlogPosts: fetch failed', message)
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPosts()
    return () => { cancelled = true }
  }, [language])

  return { posts, loading, error }
}

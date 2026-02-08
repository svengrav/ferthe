import { useEffect, useState } from 'react'
import type { BlogPost, BlogPostMetadata } from '../types/blog'

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPostMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/blog')
        if (!response.ok) {
          throw new Error(`Failed to load posts: ${response.statusText}`)
        }
        const data = await response.json()
        setPosts(data.posts)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts')
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  return { posts, loading, error }
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/blog/${slug}`)
        if (!response.ok) {
          throw new Error(`Failed to load post: ${response.statusText}`)
        }
        const data = await response.json()
        setPost(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post')
        setPost(null)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadPost()
    }
  }, [slug])

  return { post, loading, error }
}

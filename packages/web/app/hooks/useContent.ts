import { useEffect, useState } from 'react'

export type Language = 'en' | 'de'
export type ContentType = 'home' | 'privacy'

export function useContent(contentType: ContentType, language: Language) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/content/${language}/${contentType}`)
        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.statusText}`)
        }
        const data = await response.text()
        setContent(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content')
        setContent('')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [contentType, language])

  return { content, loading, error }
}

import { useMemo } from 'react'

// Unterstützte Sprachen
export type Language = 'en' | 'de'

// Content loader für verschiedene Sprachen
export function useContent(language: Language = 'en') {
  const loadContent = useMemo(() => {
    switch (language) {
      case 'en':
        return {
          privacy: () => import('@content/en/privacy.md'),
          // Weitere Inhalte können hier hinzugefügt werden
        }
      case 'de':
        return {
          privacy: () => import('@content/de/privacy.md'),
          // Deutsche Inhalte
        }
      default:
        return {
          privacy: () => import('@content/en/privacy.md'),
        }
    }
  }, [language])

  return loadContent
}

// Hook für Markdown-Verarbeitung mit Sprache
export function useMarkdownContent(language: Language = 'en') {
  const currentDate = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')
  const currentYear = new Date().getFullYear()
  
  const processContent = (markdownContent: string): string => {
    return markdownContent
      .replace('{date}', currentDate)
      .replace('{year}', currentYear.toString())
  }

  return { processContent }
}

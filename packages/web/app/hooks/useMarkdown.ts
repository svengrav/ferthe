import { useMemo } from 'react'

export function useMarkdown(markdownContent: string) {
  const processedContent = useMemo(() => {
    // Replace template variables
    const currentDate = new Date().toLocaleDateString()
    const currentYear = new Date().getFullYear()

    return markdownContent
      .replace('{date}', currentDate)
      .replace('{year}', currentYear.toString())
  }, [markdownContent])

  return processedContent
}

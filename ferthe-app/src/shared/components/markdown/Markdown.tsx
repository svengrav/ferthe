import React from 'react'
import { View, StyleSheet, Linking } from 'react-native'
import Text from '../text/Text'

type Props = {
  markdown: string
  maxLength?: number // Optional max length for truncation
}
// Safely truncate markdown without breaking formatting elements
const safelyTruncateMarkdown = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) return text

  let endIndex = maxChars

  // Check if we're in the middle of a link [text](url)
  const linkStartIndex = text.lastIndexOf('[', endIndex)
  if (linkStartIndex >= 0) {
    const linkEndIndex = text.indexOf(')', linkStartIndex)
    if (linkEndIndex > endIndex) {
      // We're cutting a link, go back to before the link
      endIndex = linkStartIndex
    }
  }

  // Check if we're in the middle of bold **text**
  const boldStartIndex = text.lastIndexOf('**', endIndex)
  if (boldStartIndex >= 0) {
    const boldEndIndex = text.indexOf('**', boldStartIndex + 2)
    if (boldEndIndex > endIndex) {
      // We're cutting bold text, go back to before the bold marker
      endIndex = Math.min(endIndex, boldStartIndex)
    }
  }

  // Check if we're in the middle of italic _text_
  const italicStartIndex = text.lastIndexOf('_', endIndex)
  if (italicStartIndex >= 0) {
    const italicEndIndex = text.indexOf('_', italicStartIndex + 1)
    if (italicEndIndex > endIndex) {
      // We're cutting italic text, go back to before the italic marker
      endIndex = Math.min(endIndex, italicStartIndex)
    }
  }

  // Try to end at a natural break point
  const lastPeriod = text.lastIndexOf('.', endIndex)
  const lastSpace = text.lastIndexOf(' ', endIndex)

  if (lastPeriod > endIndex - 20) {
    endIndex = lastPeriod + 1 // Include the period
  } else if (lastSpace > 0) {
    endIndex = lastSpace
  }

  return text.substring(0, endIndex) + '...'
}
export default function Markdown({ markdown, maxLength }: Props) {
  // If maxLength is provided, safely truncate the markdown
  const processedMarkdown = maxLength ? safelyTruncateMarkdown(markdown, maxLength) : markdown

  const lines = processedMarkdown.split('\n')

  const renderLine = (line: string, index: number) => {
    // Headings
    if (line.startsWith('# ')) {
      return (
        <Text key={index} style={styles.h1}>
          {line.replace(/^# /, '')}
        </Text>
      )
    }
    if (line.startsWith('## ')) {
      return (
        <Text key={index} style={styles.h2}>
          {line.replace(/^## /, '')}
        </Text>
      )
    }
    if (line.startsWith('- ')) {
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{line.replace(/^- /, '')}</Text>
        </View>
      )
    }

    // Process inline formatting
    let processedContent = parseInlineMarkdown(line)

    // Codeblock ``` code ```
    if (line.startsWith('```') && line.endsWith('```')) {
      return (
        <Text key={index} style={styles.codeBlock}>
          {line.replace(/```/g, '')}
        </Text>
      )
    }

    // Return the processed content
    return (
      <Text key={index} style={styles.paragraph}>
        {processedContent}
      </Text>
    )
  }

  // Parse inline markdown elements (bold, italic, links)
  const parseInlineMarkdown = (text: string) => {
    const elements: React.ReactNode[] = []
    let remainingText = text
    let lastIndex = 0

    // Process links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let linkMatch
    let textWithLinks = text

    while ((linkMatch = linkRegex.exec(text)) !== null) {
      const [fullMatch, linkText, url] = linkMatch
      const matchIndex = linkMatch.index

      // Add text before the link
      if (matchIndex > lastIndex) {
        elements.push(processBoldAndItalic(text.substring(lastIndex, matchIndex)))
      }

      // Add the link
      elements.push(
        <Text key={`link-${matchIndex}`} style={styles.link} onPress={() => Linking.openURL(url)}>
          {linkText}
        </Text>
      )

      lastIndex = matchIndex + fullMatch.length
    }

    // Add remaining text after the last link
    if (lastIndex < text.length) {
      elements.push(processBoldAndItalic(text.substring(lastIndex)))
    }

    return elements.length > 0 ? elements : processBoldAndItalic(text)
  }

  // Process bold and italic text
  const processBoldAndItalic = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = []

    // Process bold **text**
    const boldRegex = /\*\*([^*]+)\*\*/g
    let boldMatch
    let lastBoldIndex = 0
    let textWithoutBold = text

    while ((boldMatch = boldRegex.exec(text)) !== null) {
      const [fullMatch, boldText] = boldMatch
      const matchIndex = boldMatch.index

      // Add text before the bold
      if (matchIndex > lastBoldIndex) {
        const beforeText = text.substring(lastBoldIndex, matchIndex)
        elements.push(processItalic(beforeText))
      }

      // Add the bold text
      elements.push(
        <Text key={`bold-${matchIndex}`} style={styles.bold}>
          {boldText}
        </Text>
      )

      lastBoldIndex = matchIndex + fullMatch.length
    }

    // Add remaining text after the last bold
    if (lastBoldIndex < text.length) {
      elements.push(processItalic(text.substring(lastBoldIndex)))
    }

    return elements.length > 0 ? elements : [text]
  }

  // Process italic text
  const processItalic = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = []

    // Process italic _text_
    const italicRegex = /\_([^_]+)\_/g
    let italicMatch
    let lastItalicIndex = 0

    while ((italicMatch = italicRegex.exec(text)) !== null) {
      const [fullMatch, italicText] = italicMatch
      const matchIndex = italicMatch.index

      // Add text before the italic
      if (matchIndex > lastItalicIndex) {
        elements.push(text.substring(lastItalicIndex, matchIndex))
      }

      // Add the italic text
      elements.push(
        <Text key={`italic-${matchIndex}`} style={styles.italic}>
          {italicText}
        </Text>
      )

      lastItalicIndex = matchIndex + fullMatch.length
    }

    // Add remaining text after the last italic
    if (lastItalicIndex < text.length) {
      elements.push(text.substring(lastItalicIndex))
    }

    return elements.length > 0 ? elements : [text]
  }

  return <View style={styles.container}>{lines.map((line, idx) => renderLine(line, idx))}</View>
}

const styles = StyleSheet.create({
  container: {},
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 4,
  },
  paragraph: {
    fontSize: 16,
    marginVertical: 2,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  bullet: {
    fontSize: 16,
    marginRight: 6,
  },
  listText: {
    flex: 1,
    fontSize: 16,
  },
  codeBlock: {
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
})

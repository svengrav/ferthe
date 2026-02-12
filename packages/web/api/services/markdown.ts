import matter from "gray-matter";

export interface MarkdownMetadata {
  title?: string;
  date?: string;
  language?: string;
  author?: string;
  tags?: string[];
  heroImage?: string;
  [key: string]: any;
}

export interface ParsedMarkdown {
  metadata: MarkdownMetadata;
  content: string;
}

/**
 * Parse markdown file with YAML frontmatter
 * Returns structured metadata and content separately
 */
export function parseMarkdown(fileContent: string): ParsedMarkdown {
  const { data, content } = matter(fileContent);

  return {
    metadata: data || {},
    content: content.trim(),
  };
}

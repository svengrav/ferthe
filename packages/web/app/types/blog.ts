export interface BlogPostMetadata {
  title: string
  date: string
  slug: string
  language: 'en' | 'de'
  author?: string
  tags?: string[]
}

export interface BlogPost extends BlogPostMetadata {
  content: string
}

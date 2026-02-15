export interface BlogPostMetadata {
  title: string
  date: string
  slug: string
  language: 'en' | 'de'
  author?: string
  tags?: string[]
  preview?: string
  heroImage?: string
}

export interface BlogPost extends BlogPostMetadata {
  content: string
}

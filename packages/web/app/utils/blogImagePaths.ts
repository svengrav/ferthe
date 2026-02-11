/**
 * Converts relative image paths in blog post content to absolute paths
 * Example: ![alt](images/photo.jpg) -> ![alt](/blog/images/photo.jpg)
 */
export function resolveBlogImagePaths(content: string): string {
  return content.replace(
    /!\[([^\]]*)\]\(images\/([^)]+)\)/g,
    '![$1](/blog/images/$2)'
  );
}

/**
 * Converts relative heroImage path to absolute path
 * Example: images/hero.jpg -> /blog/images/hero.jpg
 */
export function resolveHeroImagePath(heroImage?: string): string | undefined {
  if (!heroImage) return undefined;
  if (heroImage.startsWith('/')) return heroImage;
  if (heroImage.startsWith('images/')) {
    return `/blog/${heroImage}`;
  }
  return heroImage;
}

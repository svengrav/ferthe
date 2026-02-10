import { blogApi } from '../api/endpoints';
import type { BlogPost } from '../types/blog';
import { useFetch } from './useFetch';

export function useBlogPosts(language: 'en' | 'de' = 'de') {
  const { data: posts, loading, error } = useFetch<BlogPost[]>(() => blogApi.list(language), [language]);

  return { posts: posts || [], loading, error };
}

export function useBlogPost(slug: string, language: 'en' | 'de' = 'de') {
  const { data: post, loading, error } = useFetch(
    () => blogApi.get(language, slug),
    [language, slug]
  );

  return { post, loading, error };
}

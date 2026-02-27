import { contentApi } from '../../api/adminClient';
import { useFetch } from '../../hooks/useFetch';
import type { BlogPost } from '../../types/blog';

export function useBlogPosts(language: 'en' | 'de' = 'de') {
  const { data: posts, loading, error } = useFetch<BlogPost[]>(
    () => contentApi.content.listBlogPosts(language).then(r => { if (!r.success) throw new Error(r.error?.message); return r.data as BlogPost[] }),
    [language],
  );

  return { posts: posts || [], loading, error };
}

export function useBlogPost(slug: string, language: 'en' | 'de' = 'de') {
  const { data: post, loading, error } = useFetch<BlogPost>(
    () => contentApi.content.getBlogPost(language, slug).then(r => { if (!r.success) throw new Error(r.error?.message); return r.data as BlogPost }),
    [language, slug],
  );

  return { post, loading, error };
}

import { contentApi } from '../api/adminClient';
import type { ContentPage } from '../types/content';
import { useFetch } from './useFetch';

export type Language = 'en' | 'de';

export function useContent(contentType: string, language: Language) {
  const { data, loading, error } = useFetch<ContentPage>(
    () => contentApi.content.getPage(language, contentType).then(r => { if (!r.success) throw new Error(r.error?.message); return r.data as ContentPage }),
    [contentType, language]
  );

  return {
    content: data?.content || '',
    metadata: data ? {
      title: data.title,
      date: data.date,
      author: data.author,
      tags: data.tags || [],
      summary: data.summary,
      heroImage: data.heroImage,
    } : undefined,
    loading,
    error,
  };
}


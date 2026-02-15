import { contentApi } from '../api/endpoints';
import type { ContentPage } from '../types/content';
import { useFetch } from './useFetch';

export type Language = 'en' | 'de';

export function useContent(contentType: string, language: Language) {
  const { data, loading, error } = useFetch<ContentPage>(
    () => contentApi.get(language, contentType),
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


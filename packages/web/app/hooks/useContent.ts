import { contentApi } from '../api/endpoints';
import { useFetch } from './useFetch';

export type Language = 'en' | 'de';
export type ContentType = 'home' | 'privacy';

export function useContent(contentType: ContentType, language: Language) {
  const { data: content, loading, error } = useFetch(
    () => contentApi.get(language, contentType),
    [contentType, language]
  );

  return { content: content || '', loading, error };
}

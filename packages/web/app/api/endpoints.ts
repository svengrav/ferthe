import type { BlogPost, BlogPostMetadata } from '../types/blog';
import { apiClient } from './client';

export const contentApi = {
  get(language: 'en' | 'de', page: 'home' | 'privacy'): Promise<string> {
    return apiClient.getText(`/api/${language}/content/${page}`);
  },
};

export const blogApi = {
  async list(language: 'en' | 'de'): Promise<BlogPostMetadata[]> {
    const response = await apiClient.get<{ posts: BlogPostMetadata[] }>(`/api/${language}/blog`);
    return response.posts;
  },

  get(language: 'en' | 'de', slug: string): Promise<BlogPost> {
    return apiClient.get<BlogPost>(`/api/${language}/blog/${slug}`);
  },
};

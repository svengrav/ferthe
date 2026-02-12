import type { BlogPost } from '../types/blog';
import type { ContentPage } from '../types/content';
import { apiClient } from './client';

export const contentApi = {
  get(language: 'en' | 'de', page: string): Promise<ContentPage> {
    return apiClient.get<ContentPage>(`/api/${language}/content/${page}`);
  },
};

export const blogApi = {
  async list(language: 'en' | 'de'): Promise<BlogPost[]> {
    const response = await apiClient.get<{ posts: BlogPost[] }>(`/api/${language}/blog`);
    return response.posts;
  },

  get(language: 'en' | 'de', slug: string): Promise<BlogPost> {
    return apiClient.get<BlogPost>(`/api/${language}/blog/${slug}`);
  },
};

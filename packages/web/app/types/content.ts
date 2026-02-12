export interface ContentPage {
  page: string;
  title: string;
  date: string;
  language: 'en' | 'de';
  author?: string;
  tags?: string[];
  summary?: string;
  heroImage?: string;
  content: string;
}

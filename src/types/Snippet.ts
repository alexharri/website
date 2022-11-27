export interface Snippet {
  title: string;
  description?: string;
  slug: string;
  snippet: {
    language: string;
    text: string;
  } | null;
}

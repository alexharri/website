export interface Post {
  title: string;
  slug: string;
  /** Empty string if not provided */
  description: string;
  /** Empty string if not provided */
  publishedAt: string;
  /** Empty string if not provided */
  updatedAt: string;
  /** Empty string if not provided */
  image: string;
}

export type PostDataStore = Partial<Record<string, unknown>>;

export interface PageLayoutProps {
  post: Post;
  children: React.ReactNode;
}

import { MdxOptions } from "../types";

export interface FrontMatter {
  title: string;
  description?: string;
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  include?: {
    firstCodeSnippet?: boolean;
  };
}

export interface GetPostsOptions {
  /**
   * @default "published"
   */
  type?: "published" | "draft";
  /**
   * Path to directory containing your posts as '.md' or '.mdx', relative to 'process.cwd()'
   *
   * @default "posts/"
   */
  postsPath?: string;
}

export interface GetPostOptions {
  mdxOptions?: MdxOptions;
  /**
   * Path to directory containing your posts as '.md' or '.mdx', relative to 'process.cwd()'
   *
   * @default "posts/"
   */
  postsPath?: string;
}

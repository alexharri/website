import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { PageLayoutProps, PostDataStore, Post, MdxOptions } from "./types";
import { usePostWatcher } from "./src/watcher-client";
import { PostDataProvider } from "./src/data";
import { FrontMatter } from "./src/internal-types";
import { GetStaticPaths, GetStaticProps } from "next";
import { DEFAULT_SLUG_PARTS } from "@alexharri/blog/src/constants";

export interface CreatePageOptions {
  components: Record<string, React.ComponentType<any> | ((props: any) => React.ReactNode)>;
  Layout: React.ComponentType<PageLayoutProps>;
}

interface PageProps {
  source: MDXRemoteSerializeResult;
  version: string;
  slug: string;
  data: PostDataStore;
}

export function createPostPage(options: CreatePageOptions) {
  function Page(props: PageProps) {
    const source = usePostWatcher(props);

    // Ensure scope is present and 'FrontMatter' has title
    let scope = ((source.scope as unknown) ?? {}) as FrontMatter;
    if (!scope.title) scope = { ...scope, title: "Untitled post" };

    const post: Post = {
      title: scope.title,
      slug: props.slug,
      description: scope.description || "",
      publishedAt: scope.publishedAt || "",
      updatedAt: scope.updatedAt || "",
      image: scope.image || "",
    };

    return (
      <options.Layout post={post}>
        <PostDataProvider data={props.data}>
          <MDXRemote {...(source as any)} components={options.components} />
        </PostDataProvider>
      </options.Layout>
    );
  }
  return Page;
}

type Params = Partial<{ [key: string]: string }>;

interface CreateGetStaticPropsOptions {
  mdxOptions?: MdxOptions;
  slug?: string;
  /**
   * @default ["slug"]
   */
  slugParts?: string[]; // TBD: Can this be inferred from call stack?
  /**
   * Path to directory containing your posts as '.md' or '.mdx', relative to 'process.cwd()'
   *
   * @default "posts/"
   */
  postsPath?: string;
}

export const createGetStaticProps =
  (options: CreateGetStaticPropsOptions = {}): GetStaticProps<PageProps, Params> =>
  async (ctx) => {
    const blogPageUtils = await import("./src/__server-only/blogPageUtils");
    let slug = options.slug;
    if (!slug) {
      const slugParts = options.slugParts || DEFAULT_SLUG_PARTS;
      slug = slugParts
        .map((key) => {
          const value = ctx.params?.[key];
          if (!value) throw new Error(`Missing context parameter '${key}'`);
          return value;
        })
        .join("/");
    }
    return blogPageUtils.getPostProps(slug, options);
  };

interface GetStaticPathsOptions {
  /**
   * If set to true, this page only renders posts that have not been published
   * and returns 404 for published posts.
   *
   * @default false
   */
  drafts?: boolean;
  /**
   * @default ["slug"]
   */
  slugParts?: string[];
  /**
   * Path to directory containing your posts as '.md' or '.mdx', relative to 'process.cwd()'
   *
   * @default "posts/"
   */
  postsPath?: string;
}

export const createGetStaticPaths =
  (options: GetStaticPathsOptions = {}): GetStaticPaths<Params> =>
  async () => {
    const blogPageUtils = await import("./src/__server-only/blogPageUtils");
    const { slugParts = DEFAULT_SLUG_PARTS, postsPath = "posts/" } = options;
    const type = options.drafts ? "draft" : "published";
    return {
      paths: blogPageUtils.getPostPaths({ type, slugParts, postsPath }),
      fallback: false,
    };
  };

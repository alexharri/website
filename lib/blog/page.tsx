import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { PageLayoutProps, PostDataStore, Post } from "./types";
import { usePostWatcher } from "./src/watcher";
import { PostDataProvider } from "./src/data";
import { FrontMatter } from "./src/internal-types";
import { GetStaticPaths, GetStaticProps } from "next";

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

type Params = {
  slug: string;
};

interface CreateGetStaticPropsOptions {
  /**
   * The slug of the post that wi
   */
  slug?: string;
}

export const createGetStaticProps =
  (options: CreateGetStaticPropsOptions = {}): GetStaticProps<PageProps, Params> =>
  async (ctx) => {
    const blogPageUtils = await import("./src/__server-only/blogPageUtils");
    if (options.slug) {
      ctx = { ...ctx, params: { ...ctx?.params, slug: options.slug } };
    }
    if (!options.slug)
      throw new Error(
        `No slug found. Either pass 'options.slug' or rename the page to '[slug].tsx'.`,
      );
    return blogPageUtils.getPostProps(ctx);
  };

interface GetStaticPathsOptions {
  /**
   * If set to true, this page only renders posts that have not been published
   * and returns 404 for published posts.
   *
   * @default false
   */
  drafts?: boolean;
}

export const createGetStaticPaths =
  (options: GetStaticPathsOptions = {}): GetStaticPaths<Params> =>
  async () => {
    const blogPageUtils = await import("./src/__server-only/blogPageUtils");
    return {
      paths: blogPageUtils.getPostPaths({ type: options.drafts ? "draft" : "published" }),
      fallback: false,
    };
  };

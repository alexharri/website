import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { postFileNames, POSTS_PATH } from "./mdxUtils";
import { Post, PostDataStore } from "../types/Post";
import { getMdxOptions } from "./mdx";

export const getPosts = (type: "published" | "draft") => {
  const posts: Post[] = [];

  for (const fileName of postFileNames) {
    const filePath = path.join(POSTS_PATH, fileName);
    const fileContent = fs.readFileSync(filePath);

    const { data } = matter(fileContent);

    const {
      title,
      description = "",
      publishedAt = "",
      updatedAt = "",
      tags = [],
    } = data as {
      title: string;
      description?: string;
      publishedAt?: string;
      updatedAt?: string;
      tags?: string[];
    };

    const slug = fileName.replace(/\.mdx?$/, "");

    const includePost = publishedAt ? type === "published" : type === "draft";

    if (includePost) {
      posts.push({ title, description, slug, publishedAt, updatedAt, tags });
    }
  }

  return posts.sort((a, b) => {
    return b.publishedAt.localeCompare(a.publishedAt);
  });
};

export function getPopularPosts() {
  const postsBySlug = getPosts("published").reduce((acc, post) => {
    acc[post.slug] = post;
    return acc;
  }, {} as Record<string, Post>);

  const popularPosts = [
    "planes",
    "clipboard",
    "typescript-structural-typing",
    "multi-cursor-code-editing-animated-introduction",
    "vector-networks",
  ];

  for (const slug of popularPosts) {
    if (!postsBySlug[slug]) {
      throw new Error(`No post with slug '${slug}'`);
    }
  }

  return popularPosts.map((slug) => postsBySlug[slug]);
}

export function getPostPaths(options: { type: "published" | "draft" }) {
  const draft = options.type === "draft";
  const paths = postFileNames
    .filter((filePath) => {
      const fileContent = fs.readFileSync(path.resolve(POSTS_PATH, filePath));
      const { data } = matter(fileContent);

      if (draft) {
        return !data.publishedAt;
      }
      return !!data.publishedAt;
    })
    .map((path) => path.replace(/\.mdx?$/, ""))
    .filter((slug) => {
      const pagePath = path.resolve(
        process.cwd(),
        `./src/pages/blog/${draft ? "draft/" : ""}${slug}.tsx`,
      );
      return !fs.existsSync(pagePath);
    })
    .map((slug) => ({ params: { slug } }));

  return [...paths];
}

function getPostData(slug: string): PostDataStore {
  const dataDir = path.resolve(process.cwd(), `./public/data/${slug}`);

  if (!fs.existsSync(dataDir)) return {};

  const out: PostDataStore = {};
  for (const fileName of fs.readdirSync(dataDir)) {
    const filePath = path.resolve(dataDir, fileName);
    const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const dataSlug = fileName.split(".")[0];
    out[dataSlug] = json;
  }
  return out;
}

type Params = {
  slug: string;
};

type Context = {
  params?: Params;
};

export const getPostProps = async (ctx: Context) => {
  const params = ctx.params!;

  let filePath = path.join(POSTS_PATH, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(POSTS_PATH, `${params.slug}.md`);
  }

  if (!fs.existsSync(filePath)) {
    return { notFound: true as const };
  }

  const fileContent = fs.readFileSync(filePath);

  const { content, data: scope } = matter(fileContent);

  const serialize = (await import("next-mdx-remote/serialize")).serialize;
  const source = await serialize(content, {
    scope,
    mdxOptions: await getMdxOptions(),
  });

  let version = "0";

  const versionFilePath = path.resolve(POSTS_PATH, "./.version", params.slug);

  if (fs.existsSync(versionFilePath)) {
    version = fs.readFileSync(versionFilePath, "utf-8");
  }

  const data = getPostData(params.slug);

  return { props: { source, slug: params.slug, data, version } };
};

export function getSlugFromFilePath(filePath: string) {
  const fileName = filePath.split("/").at(-1)!;
  const slug = fileName.split(".")[0];
  return slug;
}

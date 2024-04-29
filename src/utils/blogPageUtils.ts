import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { postFileNames, POSTS_PATH } from "./mdxUtils";
import { GetStaticPropsContext } from "next";
import { Post } from "../types/Post";
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
    } = data as {
      title: string;
      description?: string;
      publishedAt?: string;
    };

    const slug = fileName.replace(/\.mdx?$/, "");

    const includePost = publishedAt ? type === "published" : type === "draft";

    if (includePost) {
      posts.push({ title, description, slug, publishedAt });
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
  const paths = postFileNames
    .filter((filePath) => {
      const fileContent = fs.readFileSync(path.resolve(POSTS_PATH, filePath));
      const { data } = matter(fileContent);

      if (options.type === "draft") {
        return !data.publishedAt;
      }
      return !!data.publishedAt;
    })
    .map((path) => path.replace(/\.mdx?$/, ""))
    .map((slug) => ({ params: { slug } }));

  return [...paths];
}

type Params = {
  slug: string;
};

export const getPostProps = async (ctx: GetStaticPropsContext<Params>) => {
  const params = ctx.params!;

  let filePath = path.join(POSTS_PATH, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(POSTS_PATH, `${params.slug}.md`);
  }

  if (!fs.existsSync(filePath)) {
    return { notFound: true as const };
  }

  const fileContent = fs.readFileSync(filePath);

  const { content, data } = matter(fileContent);

  const serialize = (await import("next-mdx-remote/serialize")).serialize;
  const source = await serialize(content, {
    scope: data,
    mdxOptions: await getMdxOptions(),
  });

  let version = "0";

  const versionFilePath = path.resolve(POSTS_PATH, "./.version", params.slug);

  if (fs.existsSync(versionFilePath)) {
    version = fs.readFileSync(versionFilePath, "utf-8");
  }

  return { props: { source, slug: params.slug, version } };
};

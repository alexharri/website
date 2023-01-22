import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { postFileNames, POSTS_PATH } from "./mdxUtils";
import { GetStaticProps } from "next";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { Post } from "../types/Post";

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

  return posts;
};

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

  return paths;
}

interface Props {
  source: MDXRemoteSerializeResult;
  version: string;
  slug: string;
}

type Params = {
  slug: string;
};

export const getPostProps: GetStaticProps<Props, Params> = async (ctx) => {
  const params = ctx.params!;

  let filePath = path.join(POSTS_PATH, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(POSTS_PATH, `${params.slug}.md`);
  }
  const fileContent = fs.readFileSync(filePath);

  const { content, data } = matter(fileContent);

  const source = await serialize(content, {
    scope: data,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  let version = "0";

  const versionFilePath = path.resolve(POSTS_PATH, "./.version", params.slug);

  if (fs.existsSync(versionFilePath)) {
    version = fs.readFileSync(versionFilePath, "utf-8");
  }

  return { props: { source, slug: params.slug, version } };
};

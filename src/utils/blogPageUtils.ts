import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { postFileNames, POSTS_PATH } from "./mdxUtils";
import { GetStaticPropsContext } from "next";
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

  return posts.sort((a, b) => {
    return b.publishedAt.localeCompare(a.publishedAt);
  });
};

interface Redirect {
  from: string;
  to: string;
}

export function getPostPaths(options: { type: "published" | "draft" }, redirects: Redirect[] = []) {
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

  return [...paths, ...redirects.map((redirect) => ({ params: { slug: redirect.from } }))];
}

type Params = {
  slug: string;
};

export const getPostProps = async (
  ctx: GetStaticPropsContext<Params>,
  redirects: Redirect[] = [],
) => {
  const params = ctx.params!;

  const redirect = redirects.find((redirect) => redirect.from === params.slug);
  if (redirect) {
    return { redirect: { destination: `/blog/${redirect.to}`, permanent: true } };
  }

  let filePath = path.join(POSTS_PATH, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(POSTS_PATH, `${params.slug}.md`);
  }
  const fileContent = fs.readFileSync(filePath);

  const { content, data } = matter(fileContent);

  const serialize = (await import("next-mdx-remote/serialize")).serialize;
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

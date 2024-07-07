import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { postFileNames, POSTS_PATH } from "../../../../src/utils/mdxUtils";
import { getMdxOptions } from "../../../../src/utils/mdx";
import { Post, PostDataStore } from "../../types";
import { FrontMatter } from "../internal-types";

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
      image = "",
    } = data as FrontMatter;

    const slug = fileName.replace(/\.mdx?$/, "");

    const includePost = publishedAt ? type === "published" : type === "draft";

    if (includePost) {
      posts.push({ title, description, slug, publishedAt, updatedAt, image });
    }
  }

  return posts.sort((a, b) => {
    return b.publishedAt.localeCompare(a.publishedAt);
  });
};

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
  if (!ctx.params?.slug) throw new Error(`Required context field 'params.slug' missing`);

  const { slug } = ctx.params!;

  let filePath = path.join(POSTS_PATH, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(POSTS_PATH, `${slug}.md`);
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

  const versionFilePath = path.resolve(POSTS_PATH, "./.version", slug);

  if (fs.existsSync(versionFilePath)) {
    version = fs.readFileSync(versionFilePath, "utf-8");
  }

  const data = getPostData(slug);

  return { props: { source, slug, data, version } };
};

export function getSlugFromFilePath(filePath: string) {
  const fileName = filePath.split("/").at(-1)!;
  const slug = fileName.split(".")[0];
  return slug;
}

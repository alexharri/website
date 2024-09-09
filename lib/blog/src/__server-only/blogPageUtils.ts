import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { findMdFiles } from "../md";
import { Post, PostDataStore } from "../../types";
import { FrontMatter, GetPostOptions, GetPostsOptions } from "../internal-types";
import { DEFAULT_POSTS_PATH } from "../constants";

export const getPosts = (options: GetPostsOptions = {}) => {
  const { type = "published", postsPath = DEFAULT_POSTS_PATH } = options;

  const posts: Post[] = [];

  for (const fileName of findMdFiles(postsPath)) {
    const filePath = path.join(postsPath, fileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { data } = matter(fileContent);

    const {
      title,
      description = "",
      publishedAt = "",
      updatedAt = "",
      image = "",
      include = {},
    } = data as FrontMatter;

    let firstCodeSnippet: Post["firstCodeSnippet"] = null;
    if (include.firstCodeSnippet) {
      const lines = fileContent.split("\n");
      const startLineIndex = lines.findIndex((line) => line.startsWith("```"));
      let endLineIndex = -1;
      for (let i = startLineIndex + 1; i < lines.length; i++) {
        if (lines[i].startsWith("```")) {
          endLineIndex = i;
          break;
        }
      }
      if (endLineIndex !== -1) {
        const language = lines[startLineIndex].substring(3);
        const text = lines.slice(startLineIndex + 1, endLineIndex).join("\n") + "\n";
        firstCodeSnippet = { text, language };
      }
    }

    const slug = fileName.replace(/\.mdx?$/, "");

    const includePost = publishedAt ? type === "published" : type === "draft";

    if (includePost) {
      posts.push({ title, description, slug, publishedAt, updatedAt, image, firstCodeSnippet });
    }
  }

  return posts.sort((a, b) => {
    return b.publishedAt.localeCompare(a.publishedAt);
  });
};

function customPageExists(slug: string, isDraftPost: boolean) {
  const extensions = [".js", ".ts", ".jsx", ".tsx"];
  const roots = ["./src/pages", "./pages/"];
  const cwd = process.cwd();
  for (const root of roots) {
    for (const ext of extensions) {
      const pagePath = path.resolve(
        cwd,
        // TBD: /blog/ shouldn't be hardcoded
        `${root}/blog/${isDraftPost ? "draft/" : ""}${slug}${ext}`,
      );
      if (fs.existsSync(pagePath)) return true;
    }
  }
  return false;
}

interface GetPostPathsOptions {
  type: "published" | "draft";
  slugParts: string[];
  postsPath: string;
}

export function getPostPaths(options: GetPostPathsOptions) {
  const draft = options.type === "draft";
  const postsPath = path.resolve(process.cwd(), options.postsPath);

  const paths = findMdFiles(postsPath)
    .filter((filePath) => {
      const fileContent = fs.readFileSync(path.resolve(postsPath, filePath));
      const isDraftPost = !matter(fileContent).data.publishedAt;
      if (draft) return isDraftPost;
      return !isDraftPost;
    })
    .map((path) => path.replace(/\.mdx?$/, ""))
    .filter((slug) => !customPageExists(slug, draft))
    .map((slug) => {
      const slugParts = slug.split("/");
      const expectedLen = options.slugParts.length;
      if (slugParts.length !== expectedLen) {
        throw new Error(
          `Expected number of slug parts to equal ${expectedLen}. Got ${slugParts.length}`,
        );
      }
      const params: Partial<Record<string, string>> = {};
      for (const [i, key] of options.slugParts.entries()) {
        params[key] = slugParts[i];
      }
      return { params };
    });

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

export const getPostProps = async (slug: string, options: GetPostOptions = {}) => {
  const { postsPath = DEFAULT_POSTS_PATH } = options;
  let filePath = path.join(postsPath, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(postsPath, `${slug}.md`);
  }

  if (!fs.existsSync(filePath)) {
    return { notFound: true as const };
  }

  const fileContent = fs.readFileSync(filePath);

  const { content, data: scope } = matter(fileContent);

  let { mdxOptions } = options;
  if (typeof mdxOptions === "function") mdxOptions = await mdxOptions();

  const serialize = (await import("next-mdx-remote/serialize")).serialize;
  const source = await serialize(content, { scope, mdxOptions });

  let version = "0";

  const versionFilePath = path.resolve(postsPath, "./.version", slug);

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

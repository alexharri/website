import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { postFileNames, POSTS_PATH } from "./mdxUtils";

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

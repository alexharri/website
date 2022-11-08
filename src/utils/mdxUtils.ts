import fs from "fs";
import path from "path";

export const POSTS_PATH = path.resolve(process.cwd(), "./posts");

export const postFileNames = fs
  .readdirSync(POSTS_PATH)
  .filter((filePath) => /\.mdx?$/.test(filePath));

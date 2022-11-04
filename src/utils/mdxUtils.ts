import fs from "fs";
import path from "path";

export const POSTS_PATH = path.resolve(process.cwd(), "./posts");

export const postFilePaths = fs.readdirSync(POSTS_PATH);

for (const path of postFilePaths) {
  if (!/\.mdx?$/.test(path)) {
    throw new Error(`Expected '.mdx' or '.md' extension for file '${path}'`);
  }
}

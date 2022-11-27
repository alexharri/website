import fs from "fs";
import path from "path";


export const POSTS_PATH = path.resolve(process.cwd(), "./posts");
export const SNIPPETS_PATH = path.resolve(process.cwd(), "./snippets");

function findMdFiles(rootPath: string) {
  const out: string[] = [];
  const stack: string[] = [];

  function dfs(dirPath: string) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.resolve(dirPath, item);
      if (fs.statSync(itemPath).isDirectory()) {
        stack.push(item);
        dfs(itemPath);
        stack.pop();
        continue;
      }
      if (!/\.mdx?$/.test(itemPath)) continue;
      out.push([...stack, item].join("/"));
    }
  }

  dfs(rootPath);
  return out;
}

export const postFileNames = findMdFiles(POSTS_PATH);

export const snippetFileNames = findMdFiles(SNIPPETS_PATH);
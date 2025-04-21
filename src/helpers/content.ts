import path from "path";
import fs from "fs";

import { findMarkdownFilePaths } from "../utils/content";
import { POSTS_DIRNAME, SNIPPETS_DIRNAME } from "../constants";

export function getPostsDirectory() {
  return path.resolve(process.cwd(), POSTS_DIRNAME);
}

export function getSnippetsDirectory() {
  return path.resolve(process.cwd(), SNIPPETS_DIRNAME);
}

export function getPostFilePaths() {
  return findMarkdownFilePaths(getPostsDirectory());
}

export function getSnippetFilePaths() {
  return findMarkdownFilePaths(getSnippetsDirectory());
}

export function getPostContent(filePath: string) {
  return fs.readFileSync(path.resolve(getPostsDirectory(), filePath), "utf-8");
}

export function getSnippetContent(filePath: string) {
  return fs.readFileSync(path.resolve(getSnippetsDirectory(), filePath), "utf-8");
}

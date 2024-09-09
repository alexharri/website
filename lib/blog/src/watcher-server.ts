import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { POSTS_PATH } from "./constants";
import { MdxOptions } from "@alexharri/blog/types";

async function getPostHandler(req: NextApiRequest, res: NextApiResponse, mdxOptions?: MdxOptions) {
  const slug = req.query.slug as string;

  let fileContent: string | undefined;

  for (const ext of [".md", ".mdx"]) {
    const filePath = path.resolve(POSTS_PATH, slug + ext);
    if (!fs.existsSync(filePath)) continue;
    fileContent = fs.readFileSync(filePath, "utf-8");
  }

  if (!fileContent) {
    res.status(404).end();
    return;
  }

  const { content, data } = matter(fileContent);

  if (typeof mdxOptions === "function") mdxOptions = await mdxOptions();

  const source = await serialize(content, {
    scope: data,
    mdxOptions,
  });

  res.status(200).json({ source });
}

function getPostVersionHandler(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug as string;

  let version = "0";

  const filePath = path.resolve(POSTS_PATH, "./.version", slug);
  if (fs.existsSync(filePath)) {
    version = fs.readFileSync(filePath, "utf-8");
  }

  res.status(200).json({ version });
}

interface Options {
  mdxOptions?: MdxOptions;
}

export function createPostWatcherApiRoute(options: Options = {}): NextApiHandler {
  return function postWatcherApiHandler(req, res) {
    const { return: ret } = req.query;
    if (ret === "version") return getPostVersionHandler(req, res);
    if (ret === "post") return getPostHandler(req, res, options.mdxOptions);
    if (!ret) {
      res.status(400).json({ error: `Parameter 'return' is missing` });
      return;
    }
    res.status(400).json({ error: `Invalid 'return' parameter: '${ret}'` });
  };
}

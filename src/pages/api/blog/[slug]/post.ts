import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { POSTS_PATH } from "../../../../utils/mdxUtils";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import { getMdxOptions } from "../../../../utils/mdx";

export default async function getPost(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug as string;

  let fileContent: string | undefined;

  for (const ext of [".md", ".mdx"]) {
    const filePath = path.resolve(POSTS_PATH, slug + ext);
    console.log(filePath);
    if (!fs.existsSync(filePath)) continue;
    fileContent = fs.readFileSync(filePath, "utf-8");
  }

  if (!fileContent) {
    res.status(404).end();
    return;
  }

  const { content, data } = matter(fileContent);

  const source = await serialize(content, {
    scope: data,
    mdxOptions: await getMdxOptions(),
  });

  res.status(200).json({ source });
}

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { POSTS_PATH } from "../../../../utils/mdxUtils";

export default function getPost(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug as string;

  let version = "0";

  const filePath = path.resolve(POSTS_PATH, "./.version", slug);
  if (fs.existsSync(filePath)) {
    version = fs.readFileSync(filePath, "utf-8");
  }

  res.status(200).json({ version });
}

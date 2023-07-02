import fs from "fs";
import { Post } from "../src/types/Post";
import { getPosts } from "../src/utils/blogPageUtils";

function generateSitemap() {
  const posts = getPosts("published");
  const postXML = (post: Post) => {
    return `
  <url>
    <loc>https://alexharri.com/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt || post.publishedAt}</lastmod>
  </url>`.trim();
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://alexharri.com</loc>
  </url>
  ${posts.map(postXML).join("\n  ")}
</urlset>
`;
}

fs.writeFileSync("public/sitemap.xml", generateSitemap(), "utf-8");

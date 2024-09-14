import fs from "fs";
import { getPosts } from "@alexharri/blog/posts.js";
import { Post } from "@alexharri/blog";

function generateSitemap() {
  const posts = getPosts({ type: "published" });
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
  <url>
    <loc>https://alexharri.com/about</loc>
  </url>
  <url>
    <loc>https://alexharri.com/blog</loc>
  </url>
  ${posts.map(postXML).join("\n  ")}
</urlset>
`;
}

fs.writeFileSync("public/sitemap.xml", generateSitemap(), "utf-8");

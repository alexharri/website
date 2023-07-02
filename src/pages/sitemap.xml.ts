import { GetServerSidePropsContext } from "next";
import { getPosts } from "../utils/blogPageUtils";

function generateSiteMap() {
  const posts = getPosts("published");
  const postXML = (post: typeof posts[number]) => {
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

export async function getServerSideProps({ res }: GetServerSidePropsContext) {
  const sitemap = generateSiteMap();
  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();
  return {
    props: {},
  };
}

export default () => {};

import fs from "fs";
import { getPosts } from "../src/utils/blogPageUtils";
import RSS from "rss";

function generateRSS() {
  const posts = getPosts("published");

  const url = "https://alexharri.com";

  const rss = new RSS({
    feed_url: `${url}/rss.xml`,
    site_url: url,
    title: "Blog | Alex Harri",
    description:
      "Welcome to my personal website and blog. I write about TypeScript and other software engineering topics.",
    language: "en",
  });

  for (const post of posts) {
    rss.item({
      title: post.title,
      description: post.description,
      date: new Date(post.updatedAt || post.publishedAt).toUTCString(),
      url: `${url}/blog/${post.slug}`,
      author: "Alex Harri Jónsson",
    });
  }

  return rss.xml({ indent: true });
}

fs.writeFileSync("public/rss.xml", generateRSS(), "utf-8");

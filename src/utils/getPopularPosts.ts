import { Post } from "@alexharri/blog";
import { getPosts } from "@alexharri/blog/posts";

export function getPopularPosts() {
  const postsBySlug = getPosts("published").reduce((acc, post) => {
    acc[post.slug] = post;
    return acc;
  }, {} as Record<string, Post>);

  const popularPosts = [
    "planes",
    "typescript-structural-typing",
    "multi-cursor-code-editing-animated-introduction",
    "vector-networks",
  ];

  for (const slug of popularPosts) {
    if (!postsBySlug[slug]) {
      // TBD: Better error messages. What does the user do about this.
      throw new Error(`No post with slug '${slug}'`);
    }
  }

  return popularPosts.map((slug) => postsBySlug[slug]);
}

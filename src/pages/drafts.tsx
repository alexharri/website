import fs from "fs";
import matter from "gray-matter";
import { GetStaticProps } from "next";
import path from "path";
import { BlogPost } from "../components/BlogPost/BlogPost";
import { Layout } from "../components/Layout";
import { Post } from "../types/Post";
import { postFileNames, POSTS_PATH } from "../utils/mdxUtils";

interface Props {
  posts: Post[];
}

export default function Page(props: Props) {
  return (
    <Layout>
      <h1>Drafts</h1>
      {props.posts.map((post) => (
        <BlogPost post={post} key={post.slug} />
      ))}
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const posts: Post[] = [];

  for (const fileName of postFileNames) {
    const filePath = path.join(POSTS_PATH, fileName);
    const fileContent = fs.readFileSync(filePath);

    const { data } = matter(fileContent);

    const {
      title,
      description = "",
      publishedAt = "",
    } = data as {
      title: string;
      description?: string;
      publishedAt?: string;
    };

    const slug = fileName.replace(/\.mdx?$/, "");

    if (!publishedAt) {
      posts.push({ title, description, slug, publishedAt });
    }
  }

  return { props: { posts } };
};

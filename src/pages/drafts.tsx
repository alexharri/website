import { GetStaticProps } from "next";
import { BlogPost } from "../components/BlogPost/BlogPost";
import { Layout } from "../components/Layout";
import { Post } from "../types/Post";
import { getPosts } from "../utils/blogPageUtils";

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

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { posts: getPosts("draft") } };
};

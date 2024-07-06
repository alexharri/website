import { getPosts } from "@alexharri/blog/posts";
import { GetStaticProps } from "next";
import { BlogPost } from "../components/BlogPost/BlogPost";
import { Layout } from "../components/Layout";
import { Post } from "../types/Post";

interface Props {
  posts: Post[];
}

export default function Page(props: Props) {
  return (
    <Layout constrainWidth>
      <h1>Drafts</h1>
      {props.posts.map((post) => (
        <BlogPost post={post} key={post.slug} />
      ))}
      {props.posts.length === 0 && <p>There are no draft posts right now. Check back later.</p>}
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { posts: getPosts("draft") } };
};

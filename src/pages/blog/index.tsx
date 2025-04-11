import { GetStaticProps } from "next";
import Head from "next/head";
import { AboutMe } from "../../components/AboutMe/AboutMe";
import { Layout } from "../../components/Layout";
import { Post } from "../../types/Post";
import { getPopularPosts, getPosts } from "../../utils/blogPageUtils";
import { StyleOptions, useStyles } from "../../utils/styles";
import { PostListItem } from "../../components/PostListItem/PostListItem";
import { SectionAnchor } from "../../components/SectionAnchor/SectionAnchor";

interface Props {
  posts: Post[];
  popularPosts: Post[];
}

const Styles = ({ styled }: StyleOptions) => ({
  list: styled.css`
    margin-top: 16px;
    margin-bottom: 48px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
});

export default function Page(props: Props) {
  const s = useStyles(Styles);

  return (
    <Layout constrainWidth>
      <Head>
        <title>Blog | Alex Harri Jónsson</title>
      </Head>

      <h2 style={{ marginTop: 0 }}>Popular posts</h2>

      <div className={s("list")}>
        {props.popularPosts.map((post) => (
          <PostListItem post={post} key={post.slug} />
        ))}
      </div>

      <SectionAnchor id="all-posts">
        <h2>All posts</h2>
      </SectionAnchor>

      <div className={s("list")}>
        {props.posts.map((post) => (
          <PostListItem post={post} key={post.slug} />
        ))}
      </div>

      <hr style={{ margin: "80px 0" }} />

      <AboutMe />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      posts: getPosts("published"),
      popularPosts: getPopularPosts(),
    },
  };
};

import { GetStaticProps } from "next";
import { AboutMe } from "../../components/AboutMe/AboutMe";
import { Layout } from "../../components/Layout";
import { PostCard } from "../../components/PostCard/PostCard";
import { Post } from "../../types/Post";
import { getPosts } from "../../utils/blogPageUtils";
import { StyleOptions, useStyles } from "../../utils/styles";

interface Props {
  posts: Post[];
}

const Styles = ({ styled }: StyleOptions) => ({
  list: styled.css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    @media (max-width: 670px) {
      grid-template-columns: repeat(1, 1fr);
    }
  `,
});

export default function Page(props: Props) {
  const s = useStyles(Styles);

  return (
    <Layout>
      <h1>All posts</h1>

      <div className={s("list")}>
        {props.posts.map((post) => (
          <PostCard post={post} key={post.slug} />
        ))}
      </div>

      <hr style={{ margin: "80px 0" }} />

      <AboutMe />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { posts: getPosts("published") } };
};

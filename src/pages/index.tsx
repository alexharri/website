import { GetStaticProps } from "next";
import { AboutMe } from "../components/AboutMe/AboutMe";
import { ArrowIcon16 } from "../components/Icon/ArrowIcon16";
import { Layout } from "../components/Layout";
import { Link } from "../components/Link";
import { PostCard } from "../components/PostCard/PostCard";
import { PostCarousel } from "../components/PostCarousel/PostCarousel";
import { Post } from "../types/Post";
import { getPopularPosts } from "../utils/blogPageUtils";
import { StyleOptions, useStyles } from "../utils/styles";

const Styles = ({ styled }: StyleOptions) => ({
  header: styled.css`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;

    h1 {
      margin: 0;
    }
    div {
      margin-bottom: 6px;
      a {
        font-size: 20px;
      }
      @media (max-width: 500px) {
        display: none;
      }
    }
  `,

  viewAllPostsMobile: styled.css`
    margin-top: 32px;
    a {
      display: block;
      text-align: center;
      font-size: 20px;
    }
    svg {
      transform: translateY(1px);
    }
    @media (min-width: 901px) {
      display: none;
    }
  `,
});

interface Props {
  posts: Post[];
}

export default function Page(props: Props) {
  const s = useStyles(Styles);

  return (
    <Layout>
      <div className={s("header")}>
        <h1>Popular posts</h1>
        <div>
          <Link href="/blog">View all posts</Link>
        </div>
      </div>
      <PostCarousel>
        {props.posts.map((post) => (
          <PostCard post={post} key={post.slug} />
        ))}
      </PostCarousel>
      <div className={s("viewAllPostsMobile")}>
        <Link href="/blog">
          View all posts <ArrowIcon16 direction="right" />
        </Link>
      </div>

      <hr style={{ margin: "80px 0" }} />

      <AboutMe />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { posts: getPopularPosts() } };
};

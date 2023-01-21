import Link from "next/link";
import { Post } from "../../types/Post";
import styles from "./BlogPost.module.scss";

interface Props {
  post: Post;
}

export const BlogPost = (props: Props) => {
  const { post } = props;

  return (
    <article>
      <Link
        href={post.publishedAt ? `/blog/${post.slug}` : `/blog/draft/${post.slug}`}
        className={styles.link}
      >
        <h2>{post.title}</h2>
        {post.description && <p>{post.description}</p>}

        <div className={styles.read}>Read</div>
      </Link>
    </article>
  );
};

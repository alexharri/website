import Link from "next/link";
import { Post } from "../../types/Post";
import { formatDate } from "../../utils/formatDate";
import { useStyles } from "../../utils/styles";
import { PostListItemStyles } from "./PostListItem.styles";

interface Props {
  post: Post;
}

export const PostListItem = (props: Props) => {
  const s = useStyles(PostListItemStyles);

  const { post } = props;

  return (
    <article className={s("container")}>
      <Link
        href={post.publishedAt ? `/blog/${post.slug}` : `/blog/draft/${post.slug}`}
        className={s("link")}
      >
        <h3>{post.title}</h3>
        <p>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, true)}</time>{" "}
          <span className={s("dot")}>•</span> {post.description}
        </p>
      </Link>
    </article>
  );
};

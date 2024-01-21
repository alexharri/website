import Link from "next/link";
import { Post } from "../../types/Post";
import { formatDate } from "../../utils/formatDate";
import { useStyles } from "../../utils/styles";
import { PostCardStyles } from "./PostCard.styles";

interface Props {
  post: Post;
}

export const PostCard = (props: Props) => {
  const s = useStyles(PostCardStyles);

  const { post } = props;

  return (
    <article className={s("container")}>
      <Link
        href={post.publishedAt ? `/blog/${post.slug}` : `/blog/draft/${post.slug}`}
        className={s("link")}
      >
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>

        <h2>{post.title}</h2>

        {post.description && <p>{post.description}</p>}

        <div className={s("read")}>Read</div>
      </Link>
    </article>
  );
};

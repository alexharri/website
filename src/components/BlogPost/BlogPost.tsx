import Link from "next/link";
import { Post } from "../../types/Post";
import { useStyles } from "../../utils/styles";
import { BlogPostStyles } from "./BlogPost.styles";

interface Props {
  post: Post;
}

export const BlogPost = (props: Props) => {
  const s = useStyles(BlogPostStyles);

  const { post } = props;

  return (
    <article>
      <Link
        href={post.publishedAt ? `/blog/${post.slug}` : `/blog/draft/${post.slug}`}
        className={s("link")}
      >
        <h2>{post.title}</h2>

        {post.description && <p>{post.description}</p>}

        <div className={s("read")}>Read</div>
      </Link>
    </article>
  );
};

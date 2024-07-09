import { Post } from "@alexharri/blog";
import Link from "next/link";
import { useStyles } from "../../utils/styles";
import { StaticCodeBlock } from "../StaticCodeBlock/StaticCodeBlock";
import { SnippetStyles } from "./Snippet.styles";

interface Props {
  post: Post;
}

export const SnippetLink = (props: Props) => {
  const s = useStyles(SnippetStyles);

  const { post } = props;

  return (
    <article>
      <Link href={`/snippets/${post.slug}`} className={s("link")}>
        <h2 className={s("title")}>{post.title}</h2>
        {post.description && <p>{post.description}</p>}
      </Link>
      {post.firstCodeSnippet && (
        <StaticCodeBlock language={post.firstCodeSnippet.language} small noFlowOutside>
          {post.firstCodeSnippet.text}
        </StaticCodeBlock>
      )}
    </article>
  );
};

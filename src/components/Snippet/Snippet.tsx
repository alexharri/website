import Link from "next/link";
import { Snippet } from "../../types/Snippet";
import { useStyles } from "../../utils/styles";
import { StaticCodeBlock } from "../StaticCodeBlock/StaticCodeBlock";
import { SnippetStyles } from "./Snippet.styles";

interface Props {
  snippet: Snippet;
}

export const SnippetLink = (props: Props) => {
  const s = useStyles(SnippetStyles);

  const { snippet } = props;

  return (
    <article>
      <Link href={`/snippets/${snippet.slug}`} className={s("link")}>
        <h2 className={s("title")}>{snippet.title}</h2>
        {snippet.description && <p>{snippet.description}</p>}
      </Link>
      {snippet.snippet && (
        <StaticCodeBlock language={snippet.snippet.language} small>
          {snippet.snippet.text}
        </StaticCodeBlock>
      )}
    </article>
  );
};

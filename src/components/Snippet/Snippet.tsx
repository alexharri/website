import Link from "next/link";
import { Snippet } from "../../types/Snippet";
import { StaticCodeBlock } from "../StaticCodeBlock/StaticCodeBlock";
import styles from "./Snippet.module.scss";

interface Props {
  snippet: Snippet;
}

export const SnippetLink = (props: Props) => {
  const { snippet } = props;

  console.log(snippet);

  return (
    <article>
      <Link href={`/snippets/${snippet.slug}`} className={styles.link}>
        <h2>{snippet.title}</h2>
        {snippet.description && <p>{snippet.description}</p>}
        {snippet.snippet && (
          <StaticCodeBlock language={snippet.snippet.language}>
            {snippet.snippet.text}
          </StaticCodeBlock>
        )}

        <div className={styles.read}>Read</div>
      </Link>
    </article>
  );
};
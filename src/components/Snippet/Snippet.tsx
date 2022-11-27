import Link from "next/link";
import { Snippet } from "../../types/Snippet";
import { StaticCodeBlock } from "../StaticCodeBlock/StaticCodeBlock";
import styles from "./Snippet.module.scss";

interface Props {
  snippet: Snippet;
}

export const SnippetLink = (props: Props) => {
  const { snippet } = props;

  return (
    <article className={styles.container}>
      <div className={styles.linkWrapper}>
        <Link href={`/snippets/${snippet.slug}`} className={styles.link}>
          <h2 className={styles.title}>{snippet.title}</h2>
          {snippet.description && <p>{snippet.description}</p>}
        </Link>
        {snippet.snippet && (
          <div className={styles.codeBlockWrapper}>
            <StaticCodeBlock language={snippet.snippet.language} small>
              {snippet.snippet.text}
            </StaticCodeBlock>
          </div>
        )}
      </div>
    </article>
  );
};
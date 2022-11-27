import Link from "next/link";
import { Snippet } from "../../types/Snippet";
import styles from "./Snippet.module.scss";

interface Props {
  snippet: Snippet;
}

export const SnippetLink = (props: Props) => {
  const { snippet } = props;

  return (
    <article>
      <Link href={`/snippets/${snippet.slug}`} className={styles.link}>
        <h2>{snippet.title}</h2>
        {snippet.description && <p>{snippet.description}</p>}

        <div className={styles.read}>Read</div>
      </Link>
    </article>
  );
};

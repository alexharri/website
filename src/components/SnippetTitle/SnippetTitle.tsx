import { Link } from "../Link";
import styles from "./SnippetTitle.module.scss";

interface Props {
  title: string;
}

export const SnippetTitle = (props: Props) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{props.title}</h1>
      <Link href="/snippets">Back to snippets</Link>
    </div>
  );
};

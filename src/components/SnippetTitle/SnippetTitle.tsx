import { Link } from "../Link";

interface Props {
  title: string;
}

export const SnippetTitle = (props: Props) => {
  return (
    <div style={{ marginBottom: 64 }}>
      <h1 style={{ marginBottom: 0 }}>{props.title}</h1>
      <Link href="/snippets">Back to snippets</Link>
    </div>
  );
};

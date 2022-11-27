import fs from "fs";
import matter from "gray-matter";
import { GetStaticProps } from "next";
import path from "path";
import { Layout } from "../../components/Layout";
import { SnippetLink } from "../../components/Snippet/Snippet";
import { Snippet } from "../../types/Snippet";
import { snippetFileNames, SNIPPETS_PATH } from "../../utils/mdxUtils";

interface Props {
  snippets: Snippet[];
}

export default function Page(props: Props) {
  return (
    <Layout>
      <h1>Snippets</h1>
      {props.snippets.map((snippet) => (
        <SnippetLink snippet={snippet} key={snippet.slug} />
      ))}
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const snippets: Snippet[] = [];

  for (const fileName of snippetFileNames) {
    const filePath = path.join(SNIPPETS_PATH, fileName);
    const fileContent = fs.readFileSync(filePath);

    const { data } = matter(fileContent);

    const { title, description } = data as {
      title: string;
      description?: string;
    };

    const slug = fileName.replace(/\.mdx?$/, "");

    snippets.push({ title, description, slug });
  }

  return { props: { snippets } };
};

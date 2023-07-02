import fs from "fs";
import matter from "gray-matter";
import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import path from "path";
import { Layout } from "../../../components/Layout";
import { Link } from "../../../components/Link";
import { Meta } from "../../../components/Meta/Meta";
import { SmallNote } from "../../../components/SmallNote/SmallNote";
import { SnippetTitle } from "../../../components/SnippetTitle/SnippetTitle";
import { Pre, StaticCodeBlock } from "../../../components/StaticCodeBlock/StaticCodeBlock";
import { FrontMatter } from "../../../types/FrontMatter";
import { usePostWatcher } from "../../../utils/hooks/usePostWatcher";
import { snippetFileNames, SNIPPETS_PATH } from "../../../utils/mdxUtils";
import { withMargin } from "../../../utils/withMargin";

// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const components = {
  a: Link,
  pre: withMargin([32, -24], Pre),
  StaticCodeBlock: withMargin([32, -24], StaticCodeBlock),
  SmallNote,
  // ExampleComponent: dynamic(() => import("../../src/components/ExampleComponent")),
  Head,
};

interface Props {
  source: MDXRemoteSerializeResult;
  version: string;
  slug: string;
  category: string;
}

export default function PostPage(props: Props) {
  const source = usePostWatcher(props);
  const scope = source.scope! as unknown as FrontMatter;

  return (
    <>
      <Meta
        title={scope.title}
        description={scope.description}
        pathName={`/snippets/${props.category}/${props.slug}`}
      />
      <Layout>
        <main>
          <SnippetTitle title={scope.title} />
          <MDXRemote {...(source as any)} components={components} />
        </main>
      </Layout>
    </>
  );
}

type Params = {
  slug: string;
  category: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async (ctx) => {
  const params = ctx.params!;

  let filePath = path.join(SNIPPETS_PATH, params.category, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(SNIPPETS_PATH, params.category, `${params.slug}.md`);
  }
  const fileContent = fs.readFileSync(filePath);

  const { content, data } = matter(fileContent);

  const source = await serialize(content, {
    scope: data,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  let version = "0";

  const versionFilePath = path.resolve(SNIPPETS_PATH, "./.version", params.slug);

  if (fs.existsSync(versionFilePath)) {
    version = fs.readFileSync(versionFilePath, "utf-8");
  }

  return { props: { source, slug: params.slug, category: params.category, version } };
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths = snippetFileNames
    .map((path) => path.replace(/\.mdx?$/, ""))
    .map((path) => path.split("/"))
    .map(([category, slug]) => ({ params: { category, slug } }));

  return {
    paths,
    fallback: false,
  };
};

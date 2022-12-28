import fs from "fs";
import matter from "gray-matter";
import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import path from "path";
import { Layout } from "../../components/Layout";
import { Link } from "../../components/Link";
import { Meta } from "../../components/Meta/Meta";
import { FocusedScriptProvider } from "../../components/ScriptedEditor/FocusedScriptContext/FocusedScriptContext";
import { withScriptedEditor } from "../../components/ScriptedEditor/ScriptedEditor";
import { LazyScriptedEditor } from "../../components/ScriptedEditor/LazyScriptedEditor";
import { SmallNote } from "../../components/SmallNote/SmallNote";
import { Pre, StaticCodeBlock } from "../../components/StaticCodeBlock/StaticCodeBlock";
import { FrontMatter } from "../../types/FrontMatter";
import { usePostWatcher } from "../../utils/hooks/usePostWatcher";
import { postFileNames, POSTS_PATH } from "../../utils/mdxUtils";
import { withMargin } from "../../utils/withMargin";
import { MonacoThemeProvider } from "../../components/ScriptedEditor/MonacoThemeProvider";

// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const components = {
  a: Link,
  pre: withScriptedEditor(withMargin([32, -24], Pre), (props) => {
    const language = props.children.props.className?.split("-")[1] ?? "text";
    return { code: props.children.props.children, language };
  }),
  StaticCodeBlock: withScriptedEditor(withMargin([32, -24], StaticCodeBlock), (props) => ({
    code: props.children,
    language: props.language,
  })),
  SmallNote,
  ScriptedEditor: LazyScriptedEditor,
  CodeScript: (props: any) => (
    <div
      data-script-id={props.id}
      data-script={JSON.stringify(props.script)}
      data-expected-lines={props.expectedLines}
    />
  ),
  // ExampleComponent: dynamic(() => import("../../src/components/ExampleComponent")),
  Head,
};

interface Props {
  source: MDXRemoteSerializeResult;
  version: string;
  slug: string;
}

export default function PostPage(props: Props) {
  const source = usePostWatcher(props);
  const scope = source.scope! as unknown as FrontMatter;

  return (
    <>
      <Meta title={scope.title} description={scope.description} />
      <Layout>
        <main>
          <h1>{scope.title}</h1>
          <FocusedScriptProvider>
            <MonacoThemeProvider>
              <MDXRemote {...(source as any)} components={components} />
            </MonacoThemeProvider>
          </FocusedScriptProvider>
        </main>
      </Layout>
    </>
  );
}

type Params = {
  slug: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async (ctx) => {
  const params = ctx.params!;

  let filePath = path.join(POSTS_PATH, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(POSTS_PATH, `${params.slug}.md`);
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

  const versionFilePath = path.resolve(POSTS_PATH, "./.version", params.slug);

  if (fs.existsSync(versionFilePath)) {
    version = fs.readFileSync(versionFilePath, "utf-8");
  }

  return { props: { source, slug: params.slug, version } };
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths = postFileNames
    .map((path) => path.replace(/\.mdx?$/, ""))
    .map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};
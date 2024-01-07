import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Head from "next/head";
import { Layout } from "../../components/Layout";
import { Link } from "../../components/Link";
import { Meta } from "../../components/Meta/Meta";
import { FocusedScriptProvider } from "../../components/ScriptedEditor/FocusedScriptContext/FocusedScriptContext";
import { withScriptedEditor } from "../../components/ScriptedEditor/LazyScriptedEditor";
import { SmallNote } from "../../components/SmallNote/SmallNote";
import { Pre, StaticCodeBlock } from "../../components/StaticCodeBlock/StaticCodeBlock";
import { FrontMatter } from "../../types/FrontMatter";
import { usePostWatcher } from "../../utils/hooks/usePostWatcher";
import { withMargin } from "../../utils/withMargin";
import { MonacoProvider } from "../../components/ScriptedEditor/MonacoProvider";
import { getPostPaths, getPostProps } from "../../utils/blogPageUtils";
import { RenderTextCommand } from "../../components/ScriptedEditor/RenderCommand/RenderCommand";
import { NotMacOs } from "../../components/OperatingSystem/OperatingSystem";
import { Image } from "../../components/Image";
import { SectionAnchor } from "../../components/SectionAnchor/SectionAnchor";
import { formatDate } from "../../utils/formatDate";
import { Note } from "../../components/Note/Note";

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
  img: Image,
  Image,
  StaticCodeBlock: withScriptedEditor(withMargin([32, -24], StaticCodeBlock), (props) => ({
    code: props.children,
    language: props.language,
  })),
  SmallNote,
  CodeScript: (props: any) => (
    <div
      data-script-id={props.id}
      data-script={JSON.stringify(props.script)}
      data-expected-lines={props.expectedLines}
    />
  ),
  Command: RenderTextCommand,
  SectionAnchor,
  NotMacOs,
  // ExampleComponent: dynamic(() => import("../../src/components/ExampleComponent")),
  Head,
  Note,
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
      <Meta
        title={scope.title}
        description={scope.description}
        image={scope.image}
        pathName={`/blog/${props.slug}`}
      />
      <Layout>
        <main>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ marginBottom: 8 }}>{scope.title}</h1>
            {scope.publishedAt && (
              <time dateTime={scope.publishedAt} style={{ fontSize: 20 }}>
                {formatDate(scope.publishedAt)}
              </time>
            )}
          </div>
          <FocusedScriptProvider>
            <MonacoProvider>
              <MDXRemote {...(source as any)} components={components} />
            </MonacoProvider>
          </FocusedScriptProvider>
        </main>
      </Layout>
    </>
  );
}

export type Params = {
  slug: string;
};

const redirects = [{ from: "bit-sets-fast-foreach", to: "bit-set-iteration" }];

export const getStaticProps: GetStaticProps<Props, Params> = async (ctx) =>
  getPostProps(ctx, redirects);

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  return { paths: getPostPaths({ type: "published" }, redirects), fallback: false };
};

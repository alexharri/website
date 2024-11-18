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
import { MonacoProvider } from "../../components/ScriptedEditor/MonacoProvider";
import { getPostPaths, getPostProps } from "../../utils/blogPageUtils";
import { RenderTextCommand } from "../../components/ScriptedEditor/RenderCommand/RenderCommand";
import { NotMacOs } from "../../components/OperatingSystem/OperatingSystem";
import { Image } from "../../components/Image";
import { ImageCarousel } from "../../components/ImageCarousel";
import { SectionAnchor } from "../../components/SectionAnchor/SectionAnchor";
import { formatDate } from "../../utils/formatDate";
import { Note } from "../../components/Note/Note";
import { PostLayout } from "../../components/PostLayout/PostLayout";
import { Scene } from "../../threejs/scenes";
import { ThreeProvider } from "../../threejs/Components/ThreeProvider";
import { BarChart } from "../../components/BarChart/BarChart";
import { PostDataProvider } from "../../data/DataProvider";
import { PostDataStore } from "../../types/Post";
import { SubscribeToNewsletter } from "../../components/SubscribeToNewsletter/SubscribeToNewsletter";
import { usePostWatcher } from "../../utils/watcher-client";
import { Code } from "../../components/Code/Code";
import { TestCanvas } from "../../components/TestCanvas/TestCanvas";

// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const baseComponents = {
  a: Link,
  pre: withScriptedEditor(Pre, (props) => {
    const language = props.children.props.className?.split("-")[1] ?? "text";
    return { code: props.children.props.children, language };
  }),
  Code,
  img: Image,
  Image,
  ImageCarousel,
  StaticCodeBlock: withScriptedEditor(StaticCodeBlock, (props) => ({
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
  Head,
  Note,
  Scene,
  BarChart,
  EmDash: () => "—",
  TestCanvas,
};

interface Props {
  source: MDXRemoteSerializeResult;
  version: string;
  slug: string;
  data: PostDataStore;
}

export function createPage(customComponents: Record<string, React.FC<any>>) {
  const components = {
    ...baseComponents,
    ...customComponents,
  };
  return function PostPage(props: Props) {
    const source = usePostWatcher({ ...props, postsPath: "posts/" });
    const scope = source.scope! as unknown as FrontMatter;

    const pathName = scope.publishedAt ? `/blog/${props.slug}` : `/blog/draft/${props.slug}`;

    return (
      <>
        <Meta
          title={scope.title}
          description={scope.description}
          image={scope.image}
          pathName={pathName}
        />
        <Layout>
          <PostLayout>
            <div className="flow" style={{ marginBottom: 40 }}>
              <h1 style={{ marginBottom: 8 }}>{scope.title}</h1>
              {scope.publishedAt && (
                <div className="flow">
                  <time dateTime={scope.publishedAt} style={{ fontSize: 20 }}>
                    {formatDate(scope.publishedAt)}
                  </time>
                </div>
              )}
            </div>
            <PostDataProvider data={props.data}>
              <ThreeProvider>
                <FocusedScriptProvider>
                  <MonacoProvider>
                    <MDXRemote {...(source as any)} components={components} />
                  </MonacoProvider>
                </FocusedScriptProvider>
              </ThreeProvider>
            </PostDataProvider>

            {scope.publishedAt ? <SubscribeToNewsletter /> : null}
          </PostLayout>
        </Layout>
      </>
    );
  };
}

export default createPage({});

export type Params = {
  slug: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async (ctx) => getPostProps(ctx);

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  return { paths: getPostPaths({ type: "published" }), fallback: false };
};

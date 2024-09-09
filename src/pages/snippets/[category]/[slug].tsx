import { createGetStaticPaths, createGetStaticProps } from "@alexharri/blog/page";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Head from "next/head";
import { Layout } from "../../../components/Layout";
import { Link } from "../../../components/Link";
import { Meta } from "../../../components/Meta/Meta";
import { PostLayout } from "../../../components/PostLayout/PostLayout";
import { SmallNote } from "../../../components/SmallNote/SmallNote";
import { SnippetTitle } from "../../../components/SnippetTitle/SnippetTitle";
import { Pre, StaticCodeBlock } from "../../../components/StaticCodeBlock/StaticCodeBlock";
import { FrontMatter } from "../../../types/FrontMatter";
import { mdxOptions } from "../../../utils/mdxOptions";

const components = {
  a: Link,
  pre: Pre,
  StaticCodeBlock,
  SmallNote,
  Head,
};

interface Props {
  source: MDXRemoteSerializeResult;
  version: string;
  slug: string;
  category: string;
}

export default function SnippetPage(props: Props) {
  const source = props.source;
  const scope = source.scope! as unknown as FrontMatter;

  return (
    <>
      <Meta
        title={scope.title}
        description={scope.description}
        pathName={`/snippets/${props.category}/${props.slug}`}
      />
      <Layout>
        <PostLayout>
          <SnippetTitle title={scope.title} />
          <MDXRemote {...(source as any)} components={components} />
        </PostLayout>
      </Layout>
    </>
  );
}

const slugParts = ["category", "slug"];
const postsPath = "snippets/";

export const getStaticProps = createGetStaticProps({
  slugParts,
  mdxOptions,
  postsPath,
});

export const getStaticPaths = createGetStaticPaths({ slugParts, postsPath });

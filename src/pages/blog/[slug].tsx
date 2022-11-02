import fs from "fs";
import matter from "gray-matter";
import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import Link from "next/link";
import path from "path";
import { Code } from "../../components/Code";
import { Layout } from "../../components/Layout";
import { StaticCodeBlock } from "../../components/StaticCodeBlock/StaticCodeBlock";
import { FrontMatter } from "../../types/FrontMatter";
import { postFilePaths, POSTS_PATH } from "../../utils/mdxUtils";

// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const components = {
  a: Link,
  code: Code,
  // ExampleComponent: dynamic(() => import("../../src/components/ExampleComponent")),
  Head,
};

interface Props {
  source: MDXRemoteSerializeResult;
}

export default function PostPage({ source }: Props) {
  const scope = source.scope! as unknown as FrontMatter;

  return (
    <Layout>
      <div className="post-header">
        <h1>{scope.title}</h1>
      </div>
      <main>
        <MDXRemote {...(source as any)} components={components} />
      </main>

      <style jsx>{`
        .post-header h1 {
          margin-bottom: 0;
        }
        .post-header {
          margin-bottom: 2rem;
        }
        .description {
          opacity: 0.6;
        }
      `}</style>
    </Layout>
  );
}

type Params = {
  slug: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async (ctx) => {
  const params = ctx.params!;

  const filePath = path.join(POSTS_PATH, `${params.slug}.mdx`);
  const fileContent = fs.readFileSync(filePath);

  const { content, data } = matter(fileContent);

  const source = await serialize(content, {
    scope: data,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  return { props: { source } };
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths = postFilePaths
    .map((path) => path.replace(/\.mdx?$/, ""))
    .map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};

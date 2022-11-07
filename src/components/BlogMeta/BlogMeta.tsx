import Head from "next/head";

interface Props {
  title: string;
  slug: string;
  description?: string;
}

export const BlogMeta = (props: Props) => {
  return (
    <Head>
      <title>{props.title}</title>
      <meta property="og:title" content={props.title} />

      {props.description && (
        <meta name="description" content={props.description} />
      )}
      {props.description && (
        <meta name="og:description" content={props.description} />
      )}
    </Head>
  );
};

import Head from "next/head";

interface Props {
  title: string;
  description?: string;
  image?: string;
}

export const Meta = (props: Props) => {
  return (
    <Head>
      <title key="title">{props.title}</title>
      <meta key="og:title" property="og:title" content={props.title} />

      {props.description && (
        <meta key="description" name="description" content={props.description} />
      )}
      {props.description && (
        <meta key="og:description" name="og:description" content={props.description} />
      )}
      {props.image && (
        <meta key="og:image" name="og:image" content={process.env.SITE_URL + props.image} />
      )}
    </Head>
  );
};

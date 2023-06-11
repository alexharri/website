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
        <>
          <meta key="description" property="description" content={props.description} />
          <meta key="og:description" property="og:description" content={props.description} />
        </>
      )}
      <meta
        key="og:image"
        property="og:image"
        content={props.image ? process.env.SITE_URL + props.image : ""}
      />
    </Head>
  );
};

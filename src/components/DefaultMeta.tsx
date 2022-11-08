import Head from "next/head";

const title = "Posts | Alex Harri";
const description =
  "Thoughts on programming from a software developer from Iceland";

export const DefaultMeta = () => {
  return (
    <Head>
      <link rel="icon" type="image/png" href="/favicon.ico" />
      <meta http-equiv="x-ua-compatible" content="ie=edge" />
      <meta property="og:type" content="website" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />

      <title>{title}</title>
      <meta property="og:title" content={title} />

      <meta name="description" content={description} />
      <meta name="og:description" content={description} />
    </Head>
  );
};

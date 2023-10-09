import Head from "next/head";

const title = "Personal website | Alex Harri Jónsson";
const description =
  "Welcome to my personal website and blog. I write about TypeScript, and other software engineering topics.";

export const DefaultMeta = () => {
  return (
    <Head>
      <link rel="icon" type="image/png" href="/favicon.ico" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <meta key="og:type" property="og:type" content="website" />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

      <title key="title">{title}</title>
      <meta key="og:title" property="og:title" content={title} />

      <meta key="description" property="description" content={description} />
      <meta key="og:description" property="og:description" content={description} />
    </Head>
  );
};

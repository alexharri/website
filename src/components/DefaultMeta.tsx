import Head from "next/head";

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
    </Head>
  );
};

import { getPostPaths } from "../../../utils/blogPageUtils";
import { GetStaticPaths } from "next";
import { Params } from "../[slug]";

export { default, getStaticProps } from "../[slug]";

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  return { paths: getPostPaths({ type: "draft" }), fallback: false };
};

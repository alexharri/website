import { getPostPaths } from "../../../utils/getPostPaths";
import { GetStaticPaths } from "next";

export { default, getStaticProps } from "../[slug]";

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: getPostPaths({ type: "draft" }), fallback: false };
};

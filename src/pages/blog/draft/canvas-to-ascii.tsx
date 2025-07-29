import { createPage } from "../[slug]";
import { getPostProps, getSlugFromFilePath } from "../../../utils/blogPageUtils";

export default createPage({});

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};

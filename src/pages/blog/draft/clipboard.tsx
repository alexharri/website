import { createPage } from "../[slug]";
import { getPostProps, getSlugFromFilePath } from "../../../utils/blogPageUtils";
import { ClipboardTest } from "../../../components/posts/clipboard/ClipboardTest";

export default createPage({
  ClipboardTest,
});

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};

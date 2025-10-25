import { createPage } from "../[slug]";
import { getPostProps, getSlugFromFilePath } from "../../../utils/blogPageUtils";
import { AsciiScene } from "../../../components/AsciiScene";
import { CharacterPlot } from "../../../components/CharacterPlot";

export default createPage({
  AsciiScene,
  CharacterPlot,
});

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};

import { createPage } from "../[slug]";
import { getPostProps, getSlugFromFilePath } from "../../../utils/blogPageUtils";
import { AsciiScene } from "../../../components/AsciiScene";
import { CharacterPlot } from "../../../components/CharacterPlot";
import { Vector6D } from "../../../components/Vector6D/Vector6D";
import { InteractiveVector6D } from "../../../components/InteractiveVector6D/InteractiveVector6D";

export default createPage({
  AsciiScene,
  CharacterPlot,
  Vector6D,
  InteractiveVector6D,
});

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};

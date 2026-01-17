import { createPage } from "./[slug]";
import { getPostProps, getSlugFromFilePath } from "../../utils/blogPageUtils";
import { AsciiScene, WebGL2Notice, InteractiveVector6D } from "../../components/AsciiScene";
import { CharacterPlot } from "../../components/CharacterPlot";
import { Vector6D } from "../../components/Vector6D/Vector6D";
import { Scene2D } from "../../components/Scene2D/Scene2D";
import { ActiveAsciiSceneProvider } from "../../components/AsciiScene/context/ActiveAsciiSceneContext";

export default createPage(
  {
    AsciiScene,
    WebGL2Notice,
    CharacterPlot,
    Vector6D,
    Scene2D,
    InteractiveVector6D,
  },
  {
    providers: [ActiveAsciiSceneProvider],
  },
);

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};

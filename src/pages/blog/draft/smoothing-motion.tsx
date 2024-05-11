import { createPage } from "../[slug]";
import { getPostProps, getSlugFromFilePath } from "../../../utils/blogPageUtils";
import { NoLerp } from "../../../components/posts/smoothing-motion/NoLerp";
import { Lerp10Percent } from "../../../components/posts/smoothing-motion/Lerp10Percent";
import { Lerp } from "../../../components/posts/smoothing-motion/Lerp";
import { LerpSteps } from "../../../components/posts/smoothing-motion/LerpSteps";

export default createPage({
  NoLerp,
  Lerp10Percent,
  Lerp,
  LerpSteps,
});

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};

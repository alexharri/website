import { createPage } from "../[slug]";
import { getPostProps, getSlugFromFilePath } from "../../../utils/blogPageUtils";
import {
  NoNoise,
  NoNoiseShowBoundaries,
} from "../../../components/posts/stabilizing-noisy-inputs/NoNoise";
import { SomeNoise } from "../../../components/posts/stabilizing-noisy-inputs/SomeNoise";
import { NoiseComponent } from "../../../components/posts/stabilizing-noisy-inputs/NoiseComponent";

export default createPage({
  NoNoise,
  NoNoiseShowBoundaries,
  SomeNoise,
  NoiseComponent,
});

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};

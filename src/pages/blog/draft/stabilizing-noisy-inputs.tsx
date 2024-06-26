import { createPage } from "../[slug]";
import { getPostProps, getSlugFromFilePath } from "../../../utils/blogPageUtils";
import {
  NoNoise,
  NoNoiseShowBoundaries,
} from "../../../components/posts/stabilizing-noisy-inputs/NoNoise";
import { SomeNoise } from "../../../components/posts/stabilizing-noisy-inputs/SomeNoise";
import { NoiseComponent } from "../../../components/posts/stabilizing-noisy-inputs/NoiseComponent";
import { Guides } from "../../../components/posts/stabilizing-noisy-inputs/Guides";
import { Options } from "../../../components/posts/stabilizing-noisy-inputs/Options";
import { OptionsWithScore } from "../../../components/posts/stabilizing-noisy-inputs/OptionsWithScore";
import { OptionsSticky } from "../../../components/posts/stabilizing-noisy-inputs/OptionsSticky";
import { OptionsStickyGap } from "../../../components/posts/stabilizing-noisy-inputs/OptionsStickyGap";
import { OptionsStickyGapDynamic } from "../../../components/posts/stabilizing-noisy-inputs/OptionsStickyGapDynamic";
import { LargeStickinessFactors } from "../../../components/posts/stabilizing-noisy-inputs/LargeStickinessFactors";

export default createPage({
  NoNoise,
  NoNoiseShowBoundaries,
  SomeNoise,
  NoiseComponent,
  Guides,
  Options,
  OptionsWithScore,
  OptionsSticky,
  OptionsStickyGap,
  OptionsStickyGapDynamic,
  LargeStickinessFactors,
});

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};

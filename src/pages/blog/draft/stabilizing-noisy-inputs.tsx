import { createGetStaticProps, createPostPage } from "@alexharri/blog/page";
import { PostPageLayout } from "../../../components/PostPageLayout/PostPageLayout";
import { components } from "../../../components";
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

const customComponents = {
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
};

export default createPostPage({
  components: {
    ...components,
    ...customComponents,
  },
  Layout: PostPageLayout,
});

export const getStaticProps = createGetStaticProps({ slug: "stabilizing-noisy-inputs" });

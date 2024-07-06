import { createGetStaticProps, createPostPage } from "@alexharri/blog/page";
import { components } from "../../../components";
import { PostPageLayout } from "../../../components/PostPageLayout/PostPageLayout";
import { NoLerp } from "../../../components/posts/smoothing-motion/NoLerp";
import { Lerp10Percent } from "../../../components/posts/smoothing-motion/Lerp10Percent";
import { Lerp } from "../../../components/posts/smoothing-motion/Lerp";
import { LerpSteps } from "../../../components/posts/smoothing-motion/LerpSteps";

const customComponents = {
  NoLerp,
  Lerp10Percent,
  Lerp,
  LerpSteps,
};

export default createPostPage({
  components: {
    ...components,
    ...customComponents,
  },
  Layout: PostPageLayout,
});

export const getStaticProps = createGetStaticProps({ slug: "smoothing-motion" });

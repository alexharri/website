import { createGetStaticPaths, createGetStaticProps, createPostPage } from "@alexharri/blog/page";
import { PostPageLayout } from "../../components/PostPageLayout/PostPageLayout";
import { components } from "../../components";

export default createPostPage({
  components,
  Layout: PostPageLayout,
});

export const getStaticProps = createGetStaticProps();

export const getStaticPaths = createGetStaticPaths();

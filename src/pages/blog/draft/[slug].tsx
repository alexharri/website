import { createGetStaticPaths, createGetStaticProps, createPostPage } from "@alexharri/blog/page";
import { components } from "../../../components";
import { PostPageLayout } from "../../../components/PostPageLayout/PostPageLayout";

export default createPostPage({
  components,
  Layout: PostPageLayout,
});

export const getStaticProps = createGetStaticProps();

export const getStaticPaths = createGetStaticPaths({ drafts: true });

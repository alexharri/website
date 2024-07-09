import { createGetStaticPaths, createGetStaticProps, createPostPage } from "@alexharri/blog/page";
import { components } from "../../../components";
import { PostPageLayout } from "../../../components/PostPageLayout/PostPageLayout";
import { mdxOptions } from "../../../utils/mdxOptions";

export default createPostPage({
  components,
  Layout: PostPageLayout,
});

export const getStaticProps = createGetStaticProps({ mdxOptions });

export const getStaticPaths = createGetStaticPaths({ drafts: true });

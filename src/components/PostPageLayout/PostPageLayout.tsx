import { PageLayoutProps } from "@alexharri/blog";
import { ThreeProvider } from "../../threejs/Components/ThreeProvider";
import { formatDate } from "../../utils/formatDate";
import { Layout } from "../Layout";
import { Meta } from "../Meta/Meta";
import { PostLayout } from "../PostLayout/PostLayout";
import { FocusedScriptProvider } from "../ScriptedEditor/FocusedScriptContext/FocusedScriptContext";
import { MonacoProvider } from "../ScriptedEditor/MonacoProvider";

export const PostPageLayout: React.FC<PageLayoutProps> = (props) => {
  const { post, children } = props;
  return (
    <>
      <Meta
        title={post.title}
        description={post.description}
        image={post.image}
        pathName={`/blog/${post.slug}`}
      />
      <Layout>
        <PostLayout>
          <div className="flow" style={{ marginBottom: 40 }}>
            <h1 style={{ marginBottom: 8 }}>{post.title}</h1>
            {post.publishedAt && (
              <div className="flow">
                <time dateTime={post.publishedAt} style={{ fontSize: 20 }}>
                  {formatDate(post.publishedAt)}
                </time>
              </div>
            )}
          </div>
          <ThreeProvider>
            <FocusedScriptProvider>
              <MonacoProvider>{children}</MonacoProvider>
            </FocusedScriptProvider>
          </ThreeProvider>
        </PostLayout>
      </Layout>
    </>
  );
};

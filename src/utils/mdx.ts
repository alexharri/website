import { SerializeOptions } from "next-mdx-remote/dist/types";

async function rehypeMathjax() {
  const plugin = (await import("rehype-mathjax/svg")).default({ svg: { scale: 1 } });
  return () => (tree: import("hast").Root) => {
    plugin(tree);

    // If the last added child in the tree is a stylesheet containing 'mjx-container',
    // remove it. It causes Next.js hydration errors.
    //
    // Workaround for https://github.com/remarkjs/remark-math/issues/80.
    const lastChild = tree.children[tree.children.length - 1];
    if (lastChild.type === "element" && lastChild.tagName === "style") {
      const content = lastChild.children[0];

      // Make sure that this is a Mathjax related stylesheet before removing it.
      const isMathjaxStylesheet =
        content.type === "text" && content.value.includes("mjx-container");
      if (isMathjaxStylesheet) {
        tree.children.pop(); // Remove!
      }
    }
  };
}

export const getMdxOptions = async (): Promise<SerializeOptions["mdxOptions"]> => ({
  remarkPlugins: [(await import("remark-math")).default],
  rehypePlugins: [await rehypeMathjax()],
});

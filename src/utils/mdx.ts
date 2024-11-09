import { SerializeOptions } from "next-mdx-remote/dist/types";

async function rehypeMathjax() {
  // This weird pattern is to work around what happens when using
  // the '--experimental-require-module' option
  let method = (await import("rehype-mathjax/svg")).default;
  if ("default" in method) method = method.default as any;

  const plugin = method({ svg: { scale: 1 } });
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

async function remarkMath() {
  let method = (await import("remark-math")).default;
  if ("default" in method) method = method.default as any;
  return method;
}

export const getMdxOptions = async (): Promise<SerializeOptions["mdxOptions"]> => ({
  remarkPlugins: [await remarkMath()],
  rehypePlugins: [await rehypeMathjax()],
});

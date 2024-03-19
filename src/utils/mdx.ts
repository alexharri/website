import { SerializeOptions } from "next-mdx-remote/dist/types";
// import rehypeKatex from "rehype-katex";
// import rehypeStringify from "rehype-stringify";

export const getMdxOptions = async (): Promise<SerializeOptions["mdxOptions"]> => ({
  remarkPlugins: [(await import("remark-math")).default],
  // rehypePlugins: [[rehypeKatex, { output: "mathml" }]],
  rehypePlugins: [[(await import("rehype-mathjax/svg")).default, { svg: { scale: 1 } }]],
});

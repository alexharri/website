import { SerializeOptions } from "next-mdx-remote/dist/types";

export const mdxOptions = async (): Promise<SerializeOptions["mdxOptions"]> => ({
  remarkPlugins: [(await import("remark-math")).default],
  rehypePlugins: [[(await import("rehype-mathjax/svg")).default, { svg: { scale: 1 } }]],
});

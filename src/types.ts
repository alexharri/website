import { SerializeOptions } from "next-mdx-remote/dist/types";

export type MdxOptions =
  | SerializeOptions["mdxOptions"]
  | (() => SerializeOptions["mdxOptions"])
  | (() => Promise<SerializeOptions["mdxOptions"]>);

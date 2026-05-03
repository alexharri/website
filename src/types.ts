import type { serialize } from "next-mdx-remote/serialize";

export type SerializeOptions = NonNullable<Parameters<typeof serialize>[1]>;

export type MdxOptions =
  | SerializeOptions["mdxOptions"]
  | (() => SerializeOptions["mdxOptions"])
  | (() => Promise<SerializeOptions["mdxOptions"]>);

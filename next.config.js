import MonacoEditorWebpackPlugin from "monaco-editor-webpack-plugin";
import TM from "next-transpile-modules";
import { execSync } from "child_process";
import { withBlog } from "@alexharri/blog/next.config.js";

const withTM = TM([
  // `monaco-editor` isn't published to npm correctly: it includes both CSS
  // imports and non-Node friendly syntax, so it needs to be compiled.
  "monaco-editor",
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    {
      source: "/blog/bit-sets-fast-foreach",
      destination: "/blog/bit-set-iteration",
      permanent: true,
    },
  ],

  typescript: {
    tsconfigPath: "./tsconfig.next.json",
  },

  reactStrictMode: true,
  swcMinify: true,

  // See https://github.com/vercel/next.js/issues/31692
  outputFileTracing: false,

  webpack: (_config, { isServer }) => {
    const config = _config;
    if (isServer) {
      execSync("npm run generate-sitemap");
      execSync("npm run generate-rss");
    }
    config.plugins.push(new MonacoEditorWebpackPlugin());
    return config;
  },
};

export default withBlog(withTM(nextConfig));

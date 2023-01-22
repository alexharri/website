import MonacoEditorWebpackPlugin from 'monaco-editor-webpack-plugin'
import TM from "next-transpile-modules";

const withTM = TM([
  // `monaco-editor` isn't published to npm correctly: it includes both CSS
  // imports and non-Node friendly syntax, so it needs to be compiled.
  "monaco-editor"
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // See https://github.com/vercel/next.js/issues/31692
  outputFileTracing: false,

  webpack: config => {
    const rule = config.module.rules
      .find(rule => rule.oneOf)
      .oneOf.find(
        r =>
          // Find the global CSS loader
          r.issuer && r.issuer.include && r.issuer.include.includes("_app")
      );
    if (rule) {
      rule.issuer.include = [
        rule.issuer.include,
        // Allow `monaco-editor` to import global CSS:
        /[\\/]node_modules[\\/]monaco-editor[\\/]/
      ];
    }

    config.plugins.push(new MonacoEditorWebpackPlugin());
    return config;
  }
}

export default withTM(nextConfig);

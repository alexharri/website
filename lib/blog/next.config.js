import webpack from "webpack";

/**
 *
 * @param {import("next").NextConfig} config
 * @returns
 */
export function withBlog(config = {}) {
  const originalWebpack = config.webpack;
  /**
   * @param {string} phase
   * @param {{ defaultConfig: import("next").NextConfig }} options
   */
  // @ts-ignore
  return async (phase, options) => {
    config.webpack = (config, context) => {
      originalWebpack?.(config, context);
      if (!context.isServer) {
        config.plugins.push(
          // Intentionally verbose and explicit to make it hard
          // for this to match user code.
          new webpack.IgnorePlugin({ resourceRegExp: /\/__server-only\// }),
        );
      }
      return config;
    };
    return config;
  };
}

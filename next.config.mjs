import { execSync } from "child_process";

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    // Template: { source: "/blog/old-url", destination: "/blog/new-url", permanent: true },
    {
      source: "/blog/type-and-non-null-assertions",
      destination:
        "https://github.com/alexharri/website/commit/f1d2bdf092d44d4b21a94b693e20fa48801ae37c",
      permanent: true,
    },
  ],

  reactStrictMode: true,
  swcMinify: true,

  webpack: (config, { isServer }) => {
    if (isServer) {
      execSync("npm run generate-sitemap");
      execSync("npm run generate-rss");
    }
    return config;
  },
};

export default nextConfig;

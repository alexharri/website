import { execSync } from "child_process";

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    // Template: { source: "/blog/old-url", destination: "/blog/new-url", permanent: true },
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

import type { NextConfig } from "next";

const CANONICAL_DOMAIN = "ga.meow-servant.com";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?!ga\\.meow-servant\\.com).*",
          },
        ],
        destination: `https://${CANONICAL_DOMAIN}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

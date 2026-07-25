import type { NextConfig } from "next";

const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.knit-ufo.co.kr",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${apiProxyTarget}/v1/:path*`,
      },
      {
        source: "/oauth2/:path*",
        destination: `${apiProxyTarget}/oauth2/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shop-phinf.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "phinf.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
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
        source: "/api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
      {
        source: "/oauth2/:path*",
        destination: `${apiProxyTarget}/oauth2/:path*`,
      },
      {
        source: "/login/oauth2/:path*",
        destination: `${apiProxyTarget}/login/oauth2/:path*`,
      },
    ];
  },
};

export default nextConfig;

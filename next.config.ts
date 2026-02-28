import type { NextConfig } from "next";

const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
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

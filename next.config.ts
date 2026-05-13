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
      {
        protocol: "https",
        hostname: "cdn.doanity.com",
      },
      {
        protocol: "https",
        hostname: "cdn.imweb.me",
      },
      {
        protocol: "https",
        hostname: "d2gfz7wkiigkmv.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "knitspourmoi.fr",
      },
      {
        protocol: "https",
        hostname: "cdn-optimized.imweb.me",
      },
      {
        protocol: "https",
        hostname: "cdn.example.com",
      },
      {
        protocol: "https",
        hostname: "www.petiteknit.com",
      },
      {
        protocol: "https",
        hostname: "cdn3-aka.makeshop.co.kr",
      },
      {
        protocol: "https",
        hostname: "images4-g.ravelrycache.com",
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

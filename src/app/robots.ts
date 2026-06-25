import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/metadata";

const aiCrawlerUserAgents = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "anthropic-ai",
  "Bytespider",
  "Meta-ExternalAgent",
  "Amazonbot",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...aiCrawlerUserAgents.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}

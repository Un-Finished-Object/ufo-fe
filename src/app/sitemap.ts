import type { MetadataRoute } from "next";
import { fetchPublicPatternSitemapEntries } from "@/features/patterns/services/fetchPublicPatternSitemapEntries";
import { siteConfig } from "@/lib/metadata";

export const revalidate = 3_600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const patterns = await fetchPublicPatternSitemapEntries();
  const latestPatternCreatedAt = patterns.reduce<Date | undefined>(
    (latest, pattern) =>
      !latest || pattern.createdAt > latest ? pattern.createdAt : latest,
    undefined,
  );

  return [
    {
      url: siteConfig.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/patterns`,
      lastModified: latestPatternCreatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...patterns.map((pattern) => ({
      url: `${siteConfig.url}/patterns/${pattern.id}`,
      lastModified: pattern.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

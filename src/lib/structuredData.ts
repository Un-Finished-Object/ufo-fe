import { siteConfig } from "@/lib/metadata";

const homeUrl = `${siteConfig.url}/`;

export const brandStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      alternateName: siteConfig.fullName,
      description: siteConfig.description,
      url: homeUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/favicon.ico`,
        width: 500,
        height: 500,
      },
      sameAs: [siteConfig.socialLinks.instagram],
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      name: siteConfig.name,
      alternateName: [siteConfig.fullName, "knit-ufo.co.kr"],
      description: siteConfig.description,
      url: homeUrl,
      publisher: {
        "@id": `${siteConfig.url}/#organization`,
      },
    },
  ],
} as const;

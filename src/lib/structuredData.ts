import { siteConfig } from "@/lib/metadata";

const homeUrl = `${siteConfig.url}/`;
const structuredDataName = "UFO 니팅";
const structuredDataAlternateNames = [
  "UFO",
  "UFO 니트",
  "UFO 뜨개",
  "UFO Knitting",
  siteConfig.fullName,
  "knit-ufo.co.kr",
] as const;

export const brandStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: structuredDataName,
      alternateName: structuredDataAlternateNames,
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
      name: structuredDataName,
      alternateName: structuredDataAlternateNames,
      description: siteConfig.description,
      url: homeUrl,
      publisher: {
        "@id": `${siteConfig.url}/#organization`,
      },
    },
  ],
} as const;

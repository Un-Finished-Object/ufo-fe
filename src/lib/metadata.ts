import type { Metadata } from "next";

const SITE_URL = "https://www.knit-ufo.co.kr";
const SITE_NAME = "Un-Finished Object";
const SITE_DESCRIPTION =
  "UFO는 뜨개인을 위한 대체 실 추천, 도안 기반 채팅 커뮤니티 서비스입니다.";
const SITE_THEME_COLOR = "#ffaba6";

type MetadataImage = {
  url: string;
  width?: number;
  height?: number;
  alt: string;
};

const DEFAULT_OG_IMAGE: MetadataImage = {
  url: "/image/og-ufo.png",
  width: 1758,
  height: 612,
  alt: SITE_NAME,
};

export const siteConfig = {
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  themeColor: SITE_THEME_COLOR,
  ogImage: DEFAULT_OG_IMAGE,
} as const;

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path,
  image = siteConfig.ogImage,
}: {
  title: string;
  description?: string;
  path: string;
  image?: MetadataImage;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: "ko_KR",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

import type { Metadata } from "next";

const SITE_URL = "https://www.knit-ufo.co.kr";
const SITE_NAME = "UFO";
const SITE_FULL_NAME = "Un-Finished Object";
const SITE_DESCRIPTION =
  "대체실 추천받고 온라인 뜨친이랑 프로젝트 완성하기";
const SITE_THEME_COLOR = "#ffaba6";
const SITE_INSTAGRAM_URL = "https://www.instagram.com/ufoknitting";

type MetadataImage = {
  url: string;
  width?: number;
  height?: number;
  alt: string;
};

const DEFAULT_OG_IMAGE: MetadataImage = {
  url: "/image/og-ufo.png",
  width: 1350,
  height: 1001,
  alt: SITE_NAME,
};

export const siteConfig = {
  url: SITE_URL,
  name: SITE_NAME,
  fullName: SITE_FULL_NAME,
  description: SITE_DESCRIPTION,
  themeColor: SITE_THEME_COLOR,
  ogImage: DEFAULT_OG_IMAGE,
  socialLinks: {
    instagram: SITE_INSTAGRAM_URL,
  },
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
  absoluteTitle = false,
  description = siteConfig.description,
  path,
  image = siteConfig.ogImage,
}: {
  title: string;
  absoluteTitle?: boolean;
  description?: string;
  path: string;
  image?: MetadataImage;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
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

import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "@/app/providers";
import MockProvider from "@/components/providers/MockProvider";
import { siteConfig } from "@/lib/metadata";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "뜨개",
    "뜨개질",
    "뜨개 도안",
    "대체 실",
    "도안 채팅",
    "뜨개 커뮤니티",
    "UFO",
  ],
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "ko_KR",
    type: "website",
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    other: {
      "naver-site-verification": "745e9ee1b746445978b005095b4d15d0e881c49c",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <GoogleAnalytics gaId="G-HB8Y9YKSMF"></GoogleAnalytics>
      <body className="antialiased">
        <MockProvider>
          <Providers>{children}</Providers>
        </MockProvider>
      </body>
    </html>
  );
}

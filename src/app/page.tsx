import { createPageMetadata } from "@/lib/metadata";
import { brandStructuredData } from "@/lib/structuredData";
import JsonLd from "@/components/seo/JsonLd";
import HomeLandingScreen from "@/features/home/screens/HomeLandingScreen";

export const metadata = createPageMetadata({
  title: "UFO 니팅 | 뜨개 도안·대체 실 추천 커뮤니티",
  absoluteTitle: true,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={brandStructuredData} />
      <HomeLandingScreen />
    </>
  );
}

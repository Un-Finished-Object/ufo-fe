import { createPageMetadata } from "@/lib/metadata";
import { brandStructuredData } from "@/lib/structuredData";
import JsonLd from "@/components/seo/JsonLd";
import HomeLandingScreen from "@/features/home/screens/HomeLandingScreen";

export const metadata = createPageMetadata({
  title: "UFO | 뜨개 도안·대체 실 추천 커뮤니티",
  absoluteTitle: true,
  description:
    "UFO(Un-Finished Object)에서 뜨개 도안 정보와 대체 실 추천, 도안 기반 커뮤니티를 만나보세요.",
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

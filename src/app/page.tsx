import { createPageMetadata } from "@/lib/metadata";
import { brandStructuredData } from "@/lib/structuredData";
import JsonLd from "@/components/seo/JsonLd";
import HomeLandingScreen from "@/features/home/screens/HomeLandingScreen";

export const metadata = createPageMetadata({
  title: "UFO 니팅 | 당신을 위한 뜨개 올인원 패키지",
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

import { createPageMetadata } from "@/lib/metadata";
import HomeLandingScreen from "@/features/home/screens/HomeLandingScreen";

export const metadata = createPageMetadata({
  title: "대체 실 추천과 도안 커뮤니티",
  path: "/",
});

export default function HomePage() {
  return <HomeLandingScreen />;
}

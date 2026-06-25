import { createPageMetadata } from "@/lib/metadata";
import PatternCatalogScreen from "@/features/patterns/screens/PatternCatalogScreen";

export const metadata = createPageMetadata({
  title: "뜨개 도안",
  description: "UFO에서 뜨개 도안을 탐색하고 도안별 정보를 확인해보세요.",
  path: "/patterns",
});

export default function PatternsPage() {
  return <PatternCatalogScreen />;
}

import { createPageMetadata } from "@/lib/metadata";
import PatternCatalogScreen from "@/features/patterns/screens/PatternCatalogScreen";

export const metadata = createPageMetadata({
  title: "뜨개 도안",
  description: "UFO에서 뜨개 도안을 탐색하고 도안별 정보를 확인해보세요.",
  path: "/patterns",
});

type PatternsPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function PatternsPage({ searchParams }: PatternsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageParam = getSingleSearchParam(resolvedSearchParams?.page);
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return <PatternCatalogScreen initialPage={page} />;
}

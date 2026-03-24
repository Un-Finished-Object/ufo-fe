import PatternSearchScreen from "@/features/patterns/screens/PatternSearchScreen";

type PatternSearchPageProps = {
  searchParams?: Promise<{
    keyword?: string | string[];
    page?: string | string[];
  }>;
};

function getSingleSearchParam(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function PatternSearchPage({
  searchParams,
}: PatternSearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const keyword = getSingleSearchParam(resolvedSearchParams?.keyword).trim();
  const pageParam = getSingleSearchParam(resolvedSearchParams?.page);
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return (
    <PatternSearchScreen
      key={`${keyword}:${page}`}
      initialKeyword={keyword}
      initialPage={page}
    />
  );
}

import MyActivityScreen from "@/features/my/screens/MyActivityScreen";

type MyActivityPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function MyActivityPage({ searchParams }: MyActivityPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageParam = getSingleSearchParam(resolvedSearchParams?.page);
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return <MyActivityScreen key={page} initialPage={page} />;
}

import { noIndexMetadata } from "@/lib/metadata";
import ScrapCollectionScreen from "@/features/scraps/screens/ScrapCollectionScreen";

export const metadata = noIndexMetadata;

type FavoritesPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageParam = getSingleSearchParam(resolvedSearchParams?.page);
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return <ScrapCollectionScreen initialPage={page} />;
}

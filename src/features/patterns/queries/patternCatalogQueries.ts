import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  fetchPatternCatalogResults,
  type PatternCatalogResult,
} from "@/features/patterns/services/fetchPatternCatalogResults";
import { QUERY_STALE_TIME_MS } from "@/lib/query/client";

export type PatternCatalogQueryParams = {
  category: string;
  sort: string;
  page: number;
  viewerKey: string;
  subCategory?: string;
};

export const patternCatalogQueryKeys = {
  list: ({ category, sort, page, viewerKey, subCategory }: PatternCatalogQueryParams) =>
    ["patterns", "catalog", category, sort, page, subCategory ?? null, viewerKey] as const,
};

export function patternCatalogQueryOptions(params: PatternCatalogQueryParams) {
  return queryOptions<PatternCatalogResult>({
    queryKey: patternCatalogQueryKeys.list(params),
    queryFn: ({ signal }) =>
      fetchPatternCatalogResults({
        category: params.category,
        sort: params.sort,
        page: params.page,
        subCategory: params.subCategory,
        signal,
      }),
    placeholderData: keepPreviousData,
    staleTime: QUERY_STALE_TIME_MS,
  });
}

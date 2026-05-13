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
  subCategory?: string;
};

export const patternCatalogQueryKeys = {
  list: ({ category, sort, page, subCategory }: PatternCatalogQueryParams) =>
    ["patterns", "catalog", category, sort, page, subCategory ?? null] as const,
};

export function patternCatalogQueryOptions(params: PatternCatalogQueryParams) {
  return queryOptions<PatternCatalogResult>({
    queryKey: patternCatalogQueryKeys.list(params),
    queryFn: ({ signal }) =>
      fetchPatternCatalogResults({
        ...params,
        signal,
      }),
    placeholderData: keepPreviousData,
    staleTime: QUERY_STALE_TIME_MS,
  });
}

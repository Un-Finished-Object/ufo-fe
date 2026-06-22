import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  fetchPatternSearchResults,
  type PatternSearchResult,
} from "@/features/patterns/services/fetchPatternSearchResults";
import { QUERY_STALE_TIME_MS } from "@/lib/query/client";

export const patternSearchQueryKeys = {
  results: (keyword: string, page: number, viewerKey: string) =>
    ["patterns", "search", keyword, page, viewerKey] as const,
};

export function patternSearchQueryOptions(keyword: string, page: number, viewerKey: string) {
  const trimmedKeyword = keyword.trim();

  return queryOptions<PatternSearchResult>({
    queryKey: patternSearchQueryKeys.results(trimmedKeyword, page, viewerKey),
    queryFn: ({ signal }) =>
      fetchPatternSearchResults({
        keyword: trimmedKeyword,
        page,
        signal,
      }),
    enabled: trimmedKeyword.length > 0,
    placeholderData: keepPreviousData,
    staleTime: QUERY_STALE_TIME_MS,
  });
}

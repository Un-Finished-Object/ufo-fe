import { queryOptions } from "@tanstack/react-query";
import { fetchPatternScraps } from "@/features/scraps/services/fetchPatternScraps";
import { QUERY_STALE_TIME } from "@/lib/query/client";

export const patternScrapQueryKeys = {
  all: ["patternScraps"] as const,
  page: (page: number) => ["patternScraps", page] as const,
};

export function patternScrapsQueryOptions(
  page: number,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return queryOptions({
    queryKey: patternScrapQueryKeys.page(page),
    enabled,
    queryFn: ({ signal }) => fetchPatternScraps({ page, signal }),
    staleTime: QUERY_STALE_TIME.userState,
  });
}

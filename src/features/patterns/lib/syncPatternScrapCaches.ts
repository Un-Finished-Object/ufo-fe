import type { QueryClient } from "@tanstack/react-query";
import {
  homeQueryKeys,
  type HomePatternItem,
} from "@/features/home/queries/homeQueries";
import {
  patternCatalogQueryKeys,
} from "@/features/patterns/queries/patternCatalogQueries";
import type { PatternCatalogResult } from "@/features/patterns/services/fetchPatternCatalogResults";
import {
  patternDetailQueryKey,
  type PatternDetailData,
} from "@/features/patterns/queries/patternDetailQueries";
import {
  patternSearchQueryKeys,
} from "@/features/patterns/queries/patternSearchQueries";
import type { PatternSearchResult } from "@/features/patterns/services/fetchPatternSearchResults";
import { patternScrapQueryKeys } from "@/features/scraps/queries/patternScrapQueries";

type SyncPatternScrapCachesParams = {
  patternId: number;
  scrapped: boolean;
  scrapCount: number;
  viewerKey: string;
};

function updatePatternItems<T extends { id: number; isScrapped: boolean }>(
  items: T[],
  patternId: number,
  scrapped: boolean,
) {
  return items.map((item) =>
    item.id === patternId
      ? {
          ...item,
          isScrapped: scrapped,
        }
      : item,
  );
}

export function syncPatternScrapCaches(
  queryClient: QueryClient,
  {
    patternId,
    scrapped,
    scrapCount,
    viewerKey,
  }: SyncPatternScrapCachesParams,
) {
  const belongsToViewer = (query: { queryKey: readonly unknown[] }) =>
    query.queryKey[query.queryKey.length - 1] === viewerKey;
  const updateHomePatterns = (previous: HomePatternItem[] | undefined) =>
    previous ? updatePatternItems(previous, patternId, scrapped) : previous;

  queryClient.setQueriesData<HomePatternItem[]>(
    {
      queryKey: homeQueryKeys.bestPatternsRoot,
      predicate: belongsToViewer,
    },
    updateHomePatterns,
  );
  queryClient.setQueriesData<HomePatternItem[]>(
    {
      queryKey: homeQueryKeys.newPatternsRoot,
      predicate: belongsToViewer,
    },
    updateHomePatterns,
  );
  queryClient.setQueriesData<HomePatternItem[]>(
    {
      queryKey: homeQueryKeys.recommendPatternsRoot,
      predicate: belongsToViewer,
    },
    updateHomePatterns,
  );
  queryClient.setQueriesData<PatternCatalogResult>(
    {
      queryKey: patternCatalogQueryKeys.all,
      predicate: belongsToViewer,
    },
    (previous) =>
      previous
        ? {
            ...previous,
            items: updatePatternItems(previous.items, patternId, scrapped),
          }
        : previous,
  );
  queryClient.setQueriesData<PatternSearchResult>(
    {
      queryKey: patternSearchQueryKeys.all,
      predicate: belongsToViewer,
    },
    (previous) =>
      previous
        ? {
            ...previous,
            items: updatePatternItems(previous.items, patternId, scrapped),
          }
        : previous,
  );
  queryClient.setQueryData<PatternDetailData | undefined>(
    patternDetailQueryKey(patternId, viewerKey),
    (previous) =>
      previous
        ? {
            ...previous,
            isScrapped: scrapped,
            stats: {
              ...previous.stats,
              scraps: scrapCount,
            },
          }
        : previous,
  );
  void queryClient.invalidateQueries({
    queryKey: patternScrapQueryKeys.all,
  });
}

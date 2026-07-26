import { queryOptions } from "@tanstack/react-query";
import {
  normalizePatternDetailResponse,
  type PatternDetailResponse,
} from "@/features/patterns/lib/patternDetailData";
import { fetchOptionalAuth } from "@/lib/fetch/fetchOptionalAuth";
import { buildApiUrl } from "@/lib/api/client";
import { QUERY_STALE_TIME } from "@/lib/query/client";
import { throwApiError } from "@/lib/api/ApiError";

export function patternDetailQueryKey(patternId: number, viewerKey: string) {
  return ["patternDetail", patternId, viewerKey] as const;
}

export const patternDetailQueryRoot = ["patternDetail"] as const;

export async function fetchPatternDetail(
  patternId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchOptionalAuth({
    input: buildApiUrl(`/v1/patterns/${patternId}`),
    init: {
      method: "GET",
      signal,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to load pattern detail.");
  }

  return normalizePatternDetailResponse(
    (await response.json()) as PatternDetailResponse,
  );
}

export function patternDetailQueryOptions(patternId: number, viewerKey: string) {
  return queryOptions({
    queryKey: patternDetailQueryKey(patternId, viewerKey),
    queryFn: ({ signal }) => fetchPatternDetail(patternId, { signal }),
    staleTime: QUERY_STALE_TIME.reference,
  });
}

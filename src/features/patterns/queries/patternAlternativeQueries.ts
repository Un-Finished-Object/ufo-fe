import { queryOptions } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { QUERY_STALE_TIME_MS } from "@/lib/query/client";

type PatternAlternativeItemResponse = {
  altId?: number | null;
  yarnId?: number | null;
  yarnName?: string | null;
  weight?: number | null;
  cost?: number | null;
  subComponent?: string | null;
  store?: string | null;
  length?: number | null;
  username?: string | null;
};

type PatternAlternativesResponse = {
  data?: {
    items?: PatternAlternativeItemResponse[];
  };
  error?: unknown;
};

export type PatternAlternativeItem = {
  altId: number | null;
  yarnId: number | null;
  yarnName: string;
  weight: number | null;
  cost: number | null;
  subComponent: string;
  store: string;
  length: number | null;
  username: string;
};

function getSafeText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "";
}

function mapPatternAlternativeItem(
  item: PatternAlternativeItemResponse,
): PatternAlternativeItem {
  return {
    altId: typeof item.altId === "number" ? item.altId : null,
    yarnId: typeof item.yarnId === "number" ? item.yarnId : null,
    yarnName: getSafeText(item.yarnName),
    weight: typeof item.weight === "number" ? item.weight : null,
    cost: typeof item.cost === "number" ? item.cost : null,
    subComponent: getSafeText(item.subComponent),
    store: getSafeText(item.store),
    length: typeof item.length === "number" ? item.length : null,
    username: getSafeText(item.username),
  };
}

export function patternAlternativesQueryKey(patternId: number) {
  return ["patternAlternatives", patternId] as const;
}

export async function fetchPatternAlternatives(
  patternId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  const response = await fetchAuthenticated({
    input: buildApiUrl(`/v1/patterns/${patternId}/alternatives`),
    init: {
      method: "GET",
      credentials: "include",
      signal,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load pattern alternatives.");
  }

  const payload = (await response.json()) as PatternAlternativesResponse;

  if (payload.error || !payload.data || !Array.isArray(payload.data.items)) {
    throw new Error("Failed to load pattern alternatives.");
  }

  return payload.data.items
    .map(mapPatternAlternativeItem)
}

export function patternAlternativesQueryOptions(patternId: number) {
  return queryOptions({
    queryKey: patternAlternativesQueryKey(patternId),
    queryFn: ({ signal }) => fetchPatternAlternatives(patternId, { signal }),
    staleTime: QUERY_STALE_TIME_MS,
  });
}
